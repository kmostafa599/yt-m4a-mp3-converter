export const isAvailableAsync = async () => true;
export const shareAsync = async (url, options = {}) => {
  if (typeof window !== 'undefined') {
    const title = options.dialogTitle || 'SonicCraft_Audio.mp3';
    const fileName = title.endsWith('.mp3') || title.endsWith('.m4a') ? title : `${title}.mp3`;
    
    if (url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (url.startsWith('/api/download')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch (e) {}

    // Safe proxy attachment fallback
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
export default { isAvailableAsync, shareAsync };

