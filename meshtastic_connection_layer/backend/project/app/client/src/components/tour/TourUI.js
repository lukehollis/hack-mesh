
import TourNavButtons from './TourNavButtons';


export default class TourUI {
  constructor(app) {
    this.tourNavButtons = new TourNavButtons(app);

    this.tourUIElement = document.getElementById('tour-ui');
    if (this.tourUIElement) {
      this.tourUIElement.classList.remove('hidden');
    }
  }


}