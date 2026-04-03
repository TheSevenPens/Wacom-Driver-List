import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html'
    }),
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/Wacom-Driver-List' : ''
    },
    alias: {
      '$data': 'data-repo',
    }
  }
};

export default config;
