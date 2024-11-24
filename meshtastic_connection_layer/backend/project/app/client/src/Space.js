export default class Space {
  constructor() {
        this.parseDataFromHTML();
    }

    parseDataFromHTML() {
        const dataElem = document.getElementById('space_data');
        this.data = JSON.parse(dataElem.textContent);

        const meshElem = document.getElementById('space_mesh');
        this.data.mesh = JSON.parse(meshElem.textContent);

        const versionElem = document.getElementById('space_version');
        this.data.version = JSON.parse(versionElem.textContent);

        const tourDataElem = document.getElementById('tour_data');
        if (tourDataElem) {
          this.data.tour_data = JSON.parse(tourDataElem.textContent);
        }

        const continueExploringElem = document.getElementById('continue_exploring_link');
        if (continueExploringElem) {
          this.data.continue_exploring_link = JSON.parse(continueExploringElem.textContent);
        }

        const spaceCustomElem = document.getElementById('space_custom');
        if (spaceCustomElem) {
          this.data.space_custom = JSON.parse(spaceCustomElem.textContent);
        }
    }

}