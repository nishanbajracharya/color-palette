(async () => {
  const formatColor = color => {
    if (color.length === 4) {
      const values = color.split('#')[1].split('');

      return values.map(c => `${c}${c}`).join('').toUpperCase();
    }

    return color.toUpperCase();
  }

  const getPalette = async () => {
    let palettes = await Storage.get('palettes');

    if (!palettes) {
      Storage.set('palettes', DEFAULT_PALETTES);
      palettes = await Storage.get('palettes');
    }

    return palettes;
  }

  const getNewDialog = async () => {
    let newDialog = await Storage.get('newDialog');

    if (!newDialog) {
      Storage.set('newDialog', DEFAULT_NEW_DIALOG);
      newDialog = await Storage.get('newDialog');
    }

    return newDialog;
  }

  const setNewDialogValue = async value => {
    let newDialog = await Storage.get('newDialog');

    const show = value.show || true;
    const name = value.name || newDialog.name;
    const index = value.index;
    const color = value.color;
    const colors = newDialog.colors;
    colors[index] = color;

    const newValue = {
      show,
      name,
      colors
    }

    Storage.set('newDialog', newValue);
  }

  const removeColorFromNewPalette = async index => {
    let newDialog = await Storage.get('newDialog');

    const show = true;
    const name = newDialog.name;
    const colors = [].concat(newDialog.colors.slice(0, index), newDialog.colors.slice(index + 1));

    const newValue = {
      show,
      name,
      colors
    }

    Storage.set('newDialog', newValue);
  }

  const saveNewPalette = async palette => {
    const palettes = await getPalette();

    Storage.set('palettes', [].concat(palettes, [palette]));
  }

  const deletePalette = async index => {
    const palettes = await getPalette();

    const newPalette = palettes.filter((el, i) => i !== index);

    Storage.set('palettes', newPalette);
  }

  const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str.toUpperCase();
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  let notificationTimeout = 0;

  const showNotification = color => {
    clearTimeout(notificationTimeout);

    Elements.copyNotification.classList.remove('show');
    Elements.copyNotification.classList.add('show');
    Elements.copyNotification.innerHTML = `Copied ${color.toUpperCase()}`

    notificationTimeout = setTimeout(() => Elements.copyNotification.classList.remove('show'), 5000);
  }

  Elements.paletteNameInput.oninput = async e => {
    await setNewDialogValue({
      name: e.target.value
    });
  }

  const generateNewColorBox = async (color = '#FFFFFF') => {
    const colorBox = document.createElement('li');
    colorBox.setAttribute('class', 'color-box');
    colorBox.style.background = color;

    Elements.paletteNewList.appendChild(colorBox);

    const closeBtn = document.createElement('div');
    closeBtn.setAttribute('class', 'close-btn');
    closeBtn.innerHTML = `
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <path stroke="#fff" stroke-width="8.3" stroke-linecap="round" d="M14,14 L106,106 M106,14 L14,106"/>
        </svg>
        `;

    const index = Array.from(Elements.paletteNewList.children).indexOf(colorBox);

    closeBtn.onclick = async () => {
      await removeColorFromNewPalette(index);
      Elements.paletteNewList.removeChild(colorBox);
    }

    colorBox.appendChild(closeBtn);

    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('class', 'color-value-input');
    input.value = color;
    colorBox.setAttribute('color', color);
    await setNewDialogValue({
      index,
      color: color
    });

    input.oninput = async e => {
      await setNewDialogValue({
        index,
        color: e.target.value
      });
      colorBox.setAttribute('color', e.target.value);
      colorBox.style.background = e.target.value;
    }

    colorBox.appendChild(input);
  }

  Elements.colorBoxAdd.onclick = async () => {
    await generateNewColorBox('#FFFFFF');
  }

  Elements.showNewDialog.onclick = async () => {
    const newDialog = await getNewDialog();

    if (newDialog.show) {
      Storage.set('newDialog', DEFAULT_NEW_DIALOG);
    } else {
      await setNewDialogValue({
        show: true
      });
    }
  }

  Elements.saveBtn.onclick = async () => {
    const newDialog = await getNewDialog();

    const newPalette = {
      name: newDialog.name,
      colors: newDialog.colors
    }

    Storage.set('newDialog', DEFAULT_NEW_DIALOG);
    Elements.paletteNameInput.value = '';
    Elements.paletteNewList.innerHTML = '';


    if (!newDialog.name || !newDialog.colors.length) {
      return;
    }

    await saveNewPalette(newPalette);

  }

  const renderNewDialog = async () => {
    const newDialog = await getNewDialog();

    if (newDialog.show) {
      Elements.showNewDialog.classList.add('showing');
      Elements.newPalette.classList.add('show');

      return;
    }

    Elements.showNewDialog.classList.remove('showing');
    Elements.newPalette.classList.remove('show');
  }

  const renderPalette = async () => {
    const palettes = await getPalette();

    Elements.palettes.innerHTML = '';
    palettes.map(palette => {
      const li = document.createElement('li');
      li.setAttribute('class', 'palette');

      const h4 = document.createElement('h4');
      h4.innerHTML = palette.name;
      li.appendChild(h4);

      const closeBtn = document.createElement('div');
      closeBtn.innerHTML = `
        <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <path stroke="#424242" stroke-width="8.3" stroke-linecap="round" d="M14,14 L106,106 M106,14 L14,106"/>
        </svg>
        `;
      closeBtn.setAttribute('class', 'delete-palette');
      closeBtn.onclick = async () => {
        const index = Array.from(document.querySelector('.palettes').children).indexOf(li);

        await deletePalette(index);
      }
      li.appendChild(closeBtn);

      const ul = document.createElement('ul');
      ul.setAttribute('class', 'color-container');
      li.appendChild(ul);

      palette.colors.map(color => {
        const colorBox = document.createElement('li');
        colorBox.setAttribute('class', 'color-box');
        colorBox.style.background = color;
        colorBox.setAttribute('data-color', color);
        colorBox.onclick = () => {
          copyToClipboard(color);
          showNotification(color);
        };

        ul.appendChild(colorBox);

        const colorInfo = document.createElement('div');
        colorInfo.setAttribute('class', 'color-info');
        colorInfo.innerHTML = color.toUpperCase();

        colorBox.appendChild(colorInfo);
      });

      Elements.palettes.appendChild(li);
    });
  }

  const render = () => {
    renderPalette();
    renderNewDialog();
  }

  const init = async () => {
    render();

    const newDialog = await getNewDialog();

    Elements.paletteNameInput.value = newDialog.name || '';

    newDialog.colors.map(async color => {
      await generateNewColorBox(color);
    });
  }

  init();

  Storage.onChange(async action => {
    switch (action.type) {
      case 'STORAGE_CHANGED': {
        render();

        break;
      }
    }
  });
})();
