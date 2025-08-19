(function (global) {
  const Dom = {
    meta(name) {
      return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? null;
    }
  };

  function getApiBase() {
    return Dom.meta("api-base") || global.API_BASE || "/api";
  }

  function isPlainObject(v) {
    return v && typeof v === "object" &&
      !(v instanceof FormData) &&
      !(v instanceof URLSearchParams) &&
      !(v instanceof Blob) &&
      !(v instanceof ArrayBuffer);
  }

  async function request(path, { method = "GET", body = null, headers = {} } = {}) {
    const base = getApiBase();
    const url = path.startsWith("http") ? path : `${base}${path}`;
    
    const csrfToken = Dom.meta("_csrf");
    const csrfHeader = Dom.meta("_csrf_header");
    
    const defaultHeaders = {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest"
    };
    
    if (csrfToken && csrfHeader) {
      defaultHeaders[csrfHeader] = csrfToken;
    }

    const opts = {
      method,
      credentials: "same-origin",
      headers: {
        ...defaultHeaders,
        ...headers
      }
    };

    if (body != null) {
      if (isPlainObject(body)) {
        opts.headers["Content-Type"] = "application/json; charset=UTF-8";
        opts.body = JSON.stringify(body);
      } else if (body instanceof URLSearchParams) {
        opts.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
        opts.body = body;
      } else if (body instanceof FormData) {
        opts.body = body;
      } else if (typeof body === "string" || body instanceof Blob) {
        if (!opts.headers["Content-Type"]) {
          opts.headers["Content-Type"] = "application/json; charset=UTF-8";
        }
        opts.body = body;
      } else {
        opts.headers["Content-Type"] = "application/json; charset=UTF-8";
        opts.body = JSON.stringify(body);
      }
    }

    try {
      const res = await fetch(url, opts);
      const ct = res.headers.get("content-type") || "";
      
      let data;
      if (ct.includes("application/json")) {
        data = await res.json();
      } else if (ct.startsWith("text/")) {
        data = await res.text();
      } else {
        data = await res.blob();
      }

      if (!res.ok) {
        const error = new Error(`[${res.status}] ${res.statusText}`);
        error.status = res.status;
        error.response = res;
        error.data = data;
        throw error;
      }

      return { ok: true, status: res.status, data };
    } catch (error) {
      console.error("HTTP Request Error:", {
        url,
        method,
        error
      });
      throw error;
    }
  }

  global.App = global.App || {};
  global.App.Http = { request, getApiBase };
})(window);