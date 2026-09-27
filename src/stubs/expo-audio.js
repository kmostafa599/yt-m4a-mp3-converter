export const createAudioPlayer = (options) => {
  let webAudio = null;
  if (typeof window !== 'undefined' && options?.uri) {
    webAudio = new window.Audio(options.uri);
  }
  return {
    play: () => webAudio?.play(),
    pause: () => webAudio?.pause(),
    remove: () => {},
  };
};
export default { createAudioPlayer };
