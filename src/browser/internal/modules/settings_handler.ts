import _Settings from '../../../settings';

const SettingsHandler = {
  appElement: null as HTMLElement | null,

  deviceType: '',
  wallpaperUrl: '',

  settings: [
    'general.lang.code',
    'general.software_buttons.enabled',
    'homescreen.accent_color.rgb',
    'video.red_light_point.enabled',
    'video.wallpaper.url'
  ],
  SETTINGS_LANGUAGE: 0,
  SETTINGS_SOFTWARE_BUTTONS: 1,
  SETTINGS_ACCENT_COLOR: 2,
  SETTINGS_RED_LIGHT_POINT: 3,
  SETTINGS_WALLPAPER_IMAGE: 4,

  init: function () {
    this.appElement = document.querySelector('[role="app"]');

    if (
      navigator.userAgent.includes('Mobile') &&
      !navigator.userAgent.includes('Featurephone') &&
      !navigator.userAgent.includes('Qwertyphone')
    ) {
      this.deviceType = 'mobile';
    } else if (navigator.userAgent.includes('Smart TV')) {
      this.deviceType = 'smart-tv';
    } else if (navigator.userAgent.includes('VR')) {
      this.deviceType = 'vr';
    } else if (navigator.userAgent.includes('Homepad')) {
      this.deviceType = 'homepad';
    } else if (navigator.userAgent.includes('Wear')) {
      this.deviceType = 'wear';
    } else if (navigator.userAgent.includes('Mobile') && navigator.userAgent.includes('Featurephone')) {
      this.deviceType = 'featurephone';
    } else if (navigator.userAgent.includes('Mobile') && navigator.userAgent.includes('Qwertyphone')) {
      this.deviceType = 'qwertyphone';
    } else {
      this.deviceType = 'desktop';
    }

    _Settings.getValue(this.settings[this.SETTINGS_WALLPAPER_IMAGE]).then(this.handleWallpaperAccent.bind(this));
    _Settings.getValue(this.settings[this.SETTINGS_ACCENT_COLOR]).then(this.handleAccentColor.bind(this));
    _Settings.getValue(this.settings[this.SETTINGS_SOFTWARE_BUTTONS]).then(this.handleSoftwareButtons.bind(this));
    _Settings.getValue(this.settings[this.SETTINGS_RED_LIGHT_POINT]).then(this.handleRedLightPoint.bind(this));

    _Settings.addObserver(this.settings[this.SETTINGS_WALLPAPER_IMAGE], this.handleWallpaperAccent.bind(this));
    _Settings.addObserver(this.settings[this.SETTINGS_ACCENT_COLOR], this.handleAccentColor.bind(this));
    _Settings.addObserver(this.settings[this.SETTINGS_SOFTWARE_BUTTONS], this.handleSoftwareButtons.bind(this));
    _Settings.addObserver(this.settings[this.SETTINGS_RED_LIGHT_POINT], this.handleRedLightPoint.bind(this));

    window.addEventListener('localized', () => {
      _Settings.getValue(this.settings[this.SETTINGS_LANGUAGE]).then(this.handleLanguage.bind(this));
      _Settings.addObserver(this.settings[this.SETTINGS_LANGUAGE], this.handleLanguage.bind(this));
    });
  },

  getImageDominantColor: function (url: string, options: Record<string, any> = {}) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const colors = [] as Record<string, any>[];

      useCanvas(canvas, url)
        .then(() => {
          const downsamplingFactor = options.downsampling || 1;
          const imageData = canvas
            .getContext('2d')
            ?.getImageData(
              0,
              0,
              Math.floor(canvas.width / downsamplingFactor),
              Math.floor(canvas.height / downsamplingFactor)
            ).data;

          if (imageData) {
            for (let i = 0; i < imageData.length; i += 4) {
              const brightness = options.brightness || 1;
              const r = imageData[i] + Math.round((255 - imageData[i]) * (brightness - 1));
              const g = imageData[i + 1] + Math.round((255 - imageData[i + 1]) * (brightness - 1));
              const b = imageData[i + 2] + Math.round((255 - imageData[i + 2]) * (brightness - 1));

              colors.push({ r, g, b });
            }

            if (options.linearGradient !== undefined) {
              resolve('linear-gradient(' + options.linearGradient + ', ' + colors.join(', ') + ')');
            } else {
              resolve(colors);
            }
          }
        })
        .catch(reject);
    });

    function useCanvas(element: HTMLCanvasElement, imageUrl: string) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageUrl;

        image.onload = () => {
          element.width = options.colors || 1;
          element.height = options.colors || 1;

          element.getContext('2d')?.drawImage(image, 0, 0, options.colors || 1, options.colors || 1);

          resolve(null);
        };

        image.onerror = reject;
      });
    }
  },

  handleLanguage: function (value: string) {
    if ('L10n' in window) {
      // Access 'L10n' from the window object
      const l10nInstance = (window as any).L10n;

      // Use the 'getLocale' method if it exists
      if (l10nInstance && typeof l10nInstance.getLocale === 'function') {
        l10nInstance.getLocale(value);
      } else {
        console.error('L10n is not properly defined.');
      }
    } else {
      console.error('L10n is not present in the window object.');
    }
  },

  handleWallpaperAccent: function (value: string) {
    if (!this.appElement) {
      return;
    }
    const scrollingElement = document.scrollingElement as HTMLElement | null;
    this.wallpaperUrl = value;

    this.getImageDominantColor(value, { colors: 2, brightness: 1 }).then(async (color: any) => {
      // Convert the color to RGB values
      let r1 = color[0].r;
      let g1 = color[0].g;
      let b1 = color[0].b;
      let r2 = color[1].r;
      let g2 = color[1].g;
      let b2 = color[1].b;

      if (location.hostname === 'system.localhost') {
        scrollingElement?.style.setProperty('--lockscreen-accent-color-primary-r', r1);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-primary-g', g1);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-primary-b', b1);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-secondary-r', r2);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-secondary-g', g2);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-secondary-b', b2);
      }

      // Calculate relative luminance
      const luminance1 = (0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1) / 255;
      const luminance2 = (0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2) / 255;

      // Store original values
      const originalR1 = r1;
      const originalG1 = g1;
      const originalB1 = b1;
      const originalR2 = r2;
      const originalG2 = g2;
      const originalB2 = b2;

      if (luminance1 < 0.1 && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Brighten the color
        r1 = r1 * 2;
        g1 = g1 * 2;
        b1 = b1 * 2;

        // Ensure color values are within the valid range (0 - 255)
        r1 = Math.max(0, Math.min(255, r1));
        g1 = Math.max(0, Math.min(255, g1));
        b1 = Math.max(0, Math.min(255, b1));
      }

      // Check if the resulting color is too bright, and if so, darken it
      if (luminance1 > 0.8 && window.matchMedia('(prefers-color-scheme: light)').matches) {
        const maxColorValue = Math.max(r1, g1, b1);
        if (maxColorValue > 200) {
          r1 = Math.round(originalR1 * 0.8);
          g1 = Math.round(originalG1 * 0.8);
          b1 = Math.round(originalB1 * 0.8);
        }
      }

      if (luminance2 < 0.1 && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Brighten the color
        r2 = r2 * 2;
        g2 = g2 * 2;
        b2 = b2 * 2;

        // Ensure color values are within the valid range (0 - 255)
        r2 = Math.max(0, Math.min(255, r2));
        g2 = Math.max(0, Math.min(255, g2));
        b2 = Math.max(0, Math.min(255, b2));
      }

      // Check if the resulting color is too bright, and if so, darken it
      if (luminance2 > 0.8 && window.matchMedia('(prefers-color-scheme: light)').matches) {
        const maxColorValue = Math.max(r2, g2, b2);
        if (maxColorValue > 200) {
          r2 = Math.round(originalR2 * 0.8);
          g2 = Math.round(originalG2 * 0.8);
          b2 = Math.round(originalB2 * 0.8);
        }
      }

      if (!(await _Settings.getValue(this.settings[this.SETTINGS_ACCENT_COLOR]))) {
        scrollingElement?.style.setProperty('--accent-color-primary-r', r1);
        scrollingElement?.style.setProperty('--accent-color-primary-g', g1);
        scrollingElement?.style.setProperty('--accent-color-primary-b', b1);
        scrollingElement?.style.setProperty('--accent-color-secondary-r', r2);
        scrollingElement?.style.setProperty('--accent-color-secondary-g', g2);
        scrollingElement?.style.setProperty('--accent-color-secondary-b', b2);

        _Settings.setValue(this.settings[this.SETTINGS_ACCENT_COLOR], {
          primary: { r: r1, g: g1, b: b1 },
          secondary: { r: r2, g: g2, b: b2 }
        });
      }

      // Calculate relative luminance
      const accentLuminance1 = (0.2126 * originalR1 + 0.7152 * originalG1 + 0.0722 * originalB1) / 255;

      if (accentLuminance1 > 0.5) {
        this.appElement?.classList.remove('dark');
        this.appElement?.classList.add('light');
      } else {
        this.appElement?.classList.add('dark');
        this.appElement?.classList.remove('light');
      }
    });
  },

  handleAccentColor: function (value: Record<string, any>) {
    if (!value && !this.appElement) {
      return;
    }
    const scrollingElement = document.scrollingElement as HTMLElement | null;

    if (this.wallpaperUrl && location.hostname === 'system.localhost') {
      this.getImageDominantColor(this.wallpaperUrl, { colors: 2, brightness: 1 }).then((color: any) => {
        let r1 = color[0].r;
        let g1 = color[0].g;
        let b1 = color[0].b;
        let r2 = color[1].r;
        let g2 = color[1].g;
        let b2 = color[1].b;

        scrollingElement?.style.setProperty('--lockscreen-accent-color-primary-r', r1);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-primary-g', g1);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-primary-b', b1);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-secondary-r', r2);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-secondary-g', g2);
        scrollingElement?.style.setProperty('--lockscreen-accent-color-secondary-b', b2);
      });
    }

    scrollingElement?.style.setProperty('--accent-color-primary-r', value.primary.r);
    scrollingElement?.style.setProperty('--accent-color-primary-g', value.primary.g);
    scrollingElement?.style.setProperty('--accent-color-primary-b', value.primary.b);
    scrollingElement?.style.setProperty('--accent-color-secondary-r', value.secondary.r);
    scrollingElement?.style.setProperty('--accent-color-secondary-g', value.secondary.g);
    scrollingElement?.style.setProperty('--accent-color-secondary-b', value.secondary.b);

    // Convert the color to RGB values
    const r = value.primary.r;
    const g = value.primary.g;
    const b = value.primary.b;

    // Calculate relative luminance
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (luminance > 0.5) {
      scrollingElement?.style.setProperty('--accent-color-plus', 'rgba(0,0,0,0.75)');
    } else {
      scrollingElement?.style.setProperty('--accent-color-plus', 'rgba(255,255,255,0.75)');
    }
  },

  handleSoftwareButtons: function (value: boolean) {
    if (!this.appElement || location.protocol === 'orchid:') {
      return;
    }

    if (this.deviceType === 'featurephone' || this.deviceType === 'qwertyphone') {
      this.appElement.style.setProperty('--statusbar-height', '3.2rem');
    } else if (this.deviceType === 'desktop') {
      this.appElement.style.setProperty('--statusbar-height', '3.6rem');
    } else {
      this.appElement.style.setProperty('--statusbar-height', '4rem');
    }

    if (this.deviceType === 'featurephone' || this.deviceType === 'qwertyphone') {
      this.appElement.style.setProperty('--software-buttons-height', '0rem');
    } else {
      if (value) {
        this.appElement.style.setProperty('--software-buttons-height', '4rem');
      } else {
        if (location.origin.includes(`homescreen.localhost:${location.port}`)) {
          this.appElement.style.setProperty('--software-buttons-height', '1rem');
        } else {
          this.appElement.style.setProperty('--software-buttons-height', '2.5rem');
        }
      }
    }
  },

  handleRedLightPoint: function (value: string) {
    if (document.documentElement) {
      document.documentElement.dataset.redLightPoint = value;
    }
  }
};

export default SettingsHandler;
