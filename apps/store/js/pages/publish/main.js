!(function (exports) {
  'use strict';

  const Publish = {
    publishOptions: document.getElementById('publish-options'),
    webappFileForm: document.getElementById('publish-webapp-file-form'),
    webappFileInput: document.getElementById('publish-webapp-file-input'),
    iconForm: document.getElementById('publish-webapp-icon-form'),
    iconInput: document.getElementById('publish-webapp-icon-input'),
    nameForm: document.getElementById('publish-webapp-name-form'),
    nameInput: document.getElementById('publish-webapp-name-input'),
    descriptionInput: document.getElementById('publish-webapp-description-input'),
    categoriesInput: document.getElementById('publish-webapp-categories'),
    tagsInput: document.getElementById('publish-webapp-tags'),
    licenseSelect: document.getElementById('publish-webapp-license'),

    noAccountScreen: document.getElementById('publish-no-account'),

    categoriesEditable: null,
    tagsEditable: null,

    installer: '',
    icon: '',
    display_name: '',
    description: '',
    categories: [],
    tags: [],
    license: '',

    init: async function () {
      if (await _os.isLoggedIn()) {
        this.publishOptions.classList.remove('hidden');
        this.noAccountScreen.classList.remove('visible');
      } else {
        this.publishOptions.classList.add('hidden');
        this.noAccountScreen.classList.add('visible');
        return;
      }

      this.categoriesEditable = new Tags(this.categoriesInput);
      this.tagsEditable = new Tags(this.tagsInput);
    },

    uploadApp: async function () {
      await uploadAppIcon();
      this.display_name = this.nameInput.value;
      this.description = this.descriptionInput.innerText;
      this.categories = this.categoriesEditable;
      this.tags = this.tagsEditable;
    },

    uploadAppIcon: function () {
      return new Promise((resolve, reject) => {
        if (this.iconInput.files.length > 0) {
          const selectedFile = this.iconInput.files[0];
          const mimeType = selectedFile.type;

          // Create a new FileReader
          const reader = new FileReader();

          // Set up the onload event handler
          reader.onload = function (event) {
            // The result attribute contains the base64-encoded string
            const base64String = event.target.result;
            _os.storage.add(`store/${uuidv4()}.${mimeType.split('/')[1]}`, base64String);
            _os.storage.getAfterUpload(`messages/${mediaData.path}.${mediaData.mime.split('/')[1]}`).then(resolve.bind(this));
            resolve(base64String);
          };

          // Read the file as a Data URL (base64)
          reader.readAsDataURL(selectedFile);
        } else {
          console.log('No file selected');
        }
      });
    }
  };

  window.addEventListener('orchid-services-ready', () => {
    Publish.init();
  });
})(window);
