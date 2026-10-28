/*
 * Local file upload/download widget (no DB, uses localStorage only).
 * Usage: <script src="file-manager.js"></script> in dist/index.html (before </body>).
 * Files are stored as data URLs in localStorage under the key "lfm_files".
 */
(function () {
  const KEY = 'lfm_files';
  const LIMIT = 5 * 1024 * 1024; // typical localStorage quota (~5MB)

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  };
  const save = (files) => localStorage.setItem(KEY, JSON.stringify(files));

  const readAsDataURL = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });

  const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';

  async function upload(fileList) {
    const files = load();
    for (const f of fileList) {
      const data = await readAsDataURL(f);
      files.push({ id: Date.now() + Math.random().toString(36).slice(2), name: f.name, type: f.type, size: f.size, data });
      try { save(files); } catch {
        files.pop();
        alert(`"${f.name}" save nahi hui: localStorage full hai (limit ~${fmtSize(LIMIT)}).`);
      }
    }
    render();
  }

  function download(id) {
    const f = load().find((x) => x.id === id);
    if (!f) return;
    const a = document.createElement('a');
    a.href = f.data;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function remove(id) {
    save(load().filter((x) => x.id !== id));
    render();
  }

  let listEl;
  function render() {
    const files = load();
    listEl.innerHTML = '';
    if (!files.length) { listEl.textContent = 'Koi file nahi hai.'; return; }
    files.forEach((f) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid #eee';
      const name = document.createElement('span');
      name.style.flex = '1';
      name.textContent = `${f.name} (${fmtSize(f.size)})`;
      const dl = document.createElement('button');
      dl.textContent = 'Download';
      dl.onclick = () => download(f.id);
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.onclick = () => remove(f.id);
      row.append(name, dl, del);
      listEl.appendChild(row);
    });
  }

  function init() {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;width:340px;max-height:60vh;overflow:auto;background:#fff;border:1px solid #ccc;border-radius:8px;padding:12px;font:14px sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.2);z-index:99999';
    const title = document.createElement('strong');
    title.textContent = 'Local Files';
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true; // any file, from any directory
    input.style.cssText = 'display:block;margin:8px 0';
    input.onchange = async () => { await upload(input.files); input.value = ''; };
    listEl = document.createElement('div');
    box.append(title, input, listEl);
    document.body.appendChild(box);
    render();
  }

  window.LocalFileManager = { upload, download, remove, list: load };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
