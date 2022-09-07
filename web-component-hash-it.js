  const template = Object.assign(document.createElement('template'), {
        innerHTML: `<style>
      #drop-area {
        border: 2px dashed #ccc;
        border-radius: 20px;
        padding: 20px;
      }
      #drop-area.highlight {
        border-color: purple;
      }
  </style>
  <div id="drop-area">
    <p>Upload a zip file with the file dialog or by dragging and dropping any zip file onto the dashed region</p>
    <label class="button" for="fileInput">Select a file</label>
    <input type="file" id="fileInput" multiple accept="application/zip">
  </div>
  <div id=results style="display:none"></div>`
      });
  
  class HashIt extends HTMLElement {
    constructor() {
      super();
      
      const shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild(template.content.cloneNode(true));
      
      // this.shadowRoot = shadowRoot;
      this.preventDefaults = this.preventDefaults.bind(this);
      this.highlight = this.highlight.bind(this);
      this.unhighlight = this.unhighlight.bind(this);
      this.alertIt = this.alertIt.bind(this);
      this.handleDrop = this.handleDrop.bind(this);
      this.alertClick = this.alertClick.bind(this);
      this.digestMessage = this.digestMessage.bind(this);
    }
    
    connectedCallback() {
      this.input = this.shadowRoot.getElementById('fileInput');
      this.dropArea = this.shadowRoot.getElementById('drop-area');
      this.container = this.shadowRoot.getElementById('results');
      
      this.input.addEventListener('change', this.handleDrop, false);
      this.dropArea.addEventListener('drop', this.handleDrop, false);
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => this.dropArea.addEventListener(eventName, this.preventDefaults, false));
      ['dragenter', 'dragover'].forEach(eventName => this.dropArea.addEventListener(eventName, this.highlight, false));
      ['dragleave', 'drop'].forEach(eventName => this.dropArea.addEventListener(eventName, this.unhighlight, false));
    }

    disconnectedCallback() {
      this.input.removeEventListener('change', this.handleDrop, false);
      this.dropArea.removeEventListener('drop', this.handleDrop, false);
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => this.dropArea.removeEventListener(eventName, this.preventDefaults, false));
      ['dragenter', 'dragover'].forEach(eventName => this.dropArea.addEventListener(eventName, this.highlight, false));
      ['dragleave', 'drop'].forEach(eventName => this.dropArea.removeEventListener(eventName, this.unhighlight, false));
    }
    
    preventDefaults (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    highlight(e) {
      this.dropArea.classList.add('highlight')
    }

    unhighlight(e) {
      this.dropArea.classList.remove('highlight')
    }

    alertIt(file, obj) {
      this.container.style.display = 'block';
      this.dropArea.style.display = 'none';

      this.container.append(Object.assign(document.createElement('h3'), {
        innerText: file.name
      }))
      Object.keys(obj).forEach(key => this.container.append(Object.assign(document.createElement('p'), {
        innerText:`${obj[key].type}: ${obj[key].hash}`
      })));
      this.btn = document.createElement('button');
      this.btn.innerText = 'Reset';
      this.btn.addEventListener('click', this.alertClick)
      this.container.append(this.btn)
    }

    async handleDrop(e) {
      let file;
      if (e.dataTransfer) {
        file = e.dataTransfer.files[0];
      } else {
        file = e.target.files[0]
      }

      const blobUint = await fetch(URL.createObjectURL(file)).then(res => res.arrayBuffer());
      Promise.all(['SHA-256', 'SHA-384', 'SHA-512'].map(x => this.digestMessage(x, blobUint)))
        .then(obj => this.alertIt(file, obj))
        .catch(err => alert('Something went wrong 😵‍💫'))
    }

    async digestMessage(type, blobUint) {
      const hashBuffer = await crypto.subtle.digest(type, blobUint);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return {
        type: type,
        hash: hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      };
    }
    
    alertClick() {
      if (this.btn)
        this.btn.removeEventListener('click', this.alertClick)

      this.container.style.display = 'none';
      this.dropArea.style.display = 'block';
      this.input.value = '';
      [...this.shadowRoot.getElementById('results').children].forEach(x => x.remove());
    }
  }
  
  customElements.define('hash-it', HashIt)
