(function (global) {
  var STORAGE_KEY = "selected_drill_ids";
  var cache = null;

  function normalizeId(id) {
    return typeof id === "string" ? id.trim() : "";
  }

  function readFromStorage() {
    if (cache) return cache;

    var parsed = [];
    try {
      var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        var json = JSON.parse(raw);
        if (Array.isArray(json)) {
          parsed = json.filter(function (id) {
            return typeof id === "string" && id.trim();
          });
        }
      }
    } catch (_) {
      parsed = [];
    }

    cache = Array.from(new Set(parsed));
    return cache;
  }

  function sync() {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(readFromStorage()));
      }
    } catch (_) {
      // Ignore storage write issues (private mode/quota)
    }
  }

  function getSelectedDrillIds() {
    return readFromStorage().slice();
  }

  function isDrillSelected(id) {
    var normalized = normalizeId(id);
    if (!normalized) return false;
    return readFromStorage().indexOf(normalized) !== -1;
  }

  function addSelectedDrill(id) {
    var normalized = normalizeId(id);
    if (!normalized) return;
    var list = readFromStorage();
    if (list.indexOf(normalized) === -1) {
      list.push(normalized);
      sync();
    }
  }

  function removeSelectedDrill(id) {
    var normalized = normalizeId(id);
    if (!normalized) return;
    var list = readFromStorage();
    var idx = list.indexOf(normalized);
    if (idx !== -1) {
      list.splice(idx, 1);
      sync();
    }
  }

  function toggleSelectedDrill(id) {
    var normalized = normalizeId(id);
    if (!normalized) return false;
    if (isDrillSelected(normalized)) {
      removeSelectedDrill(normalized);
      return false;
    }
    addSelectedDrill(normalized);
    return true;
  }

  function clearSelectedDrills() {
    cache = [];
    sync();
  }

  var api = {
    getSelectedDrillIds: getSelectedDrillIds,
    isDrillSelected: isDrillSelected,
    addSelectedDrill: addSelectedDrill,
    removeSelectedDrill: removeSelectedDrill,
    toggleSelectedDrill: toggleSelectedDrill,
    clearSelectedDrills: clearSelectedDrills
  };

  // Tiny sanity helper for manual dev checks from console.
  api.__devSanityCheck = function () {
    var before = getSelectedDrillIds().length;
    var id = "__sanity__";
    addSelectedDrill(id);
    var added = isDrillSelected(id);
    removeSelectedDrill(id);
    var removed = !isDrillSelected(id);
    return { ok: added && removed && getSelectedDrillIds().length === before, added: added, removed: removed };
  };

  global.SelectedDrillsStore = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
