import ArtOfIntimidationTemple from './ArtOfIntimidationTemple';
import Store from '../../Store';


const small_break_width = 640;

export default class ArtOfIntimidation {
    constructor() {
        this.setupUI();
    }

    setupTemple() {
        const { app } = Store.getState();
        app.setLightIntensity(0.001);
        this.temple = new ArtOfIntimidationTemple();
    }

    setupUI() {
        const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));



        // setup narrator 
        const video = document.createElement('video');
        video.src = `https://static.mused.org/Narrator3.webm`;
        video.crossOrigin = 'anonymous'; 
        video.load();
        video.loop = true;
        video.setAttribute('id', 'narrator'); 
        video.className = "fixed bottom-0 -left-4 sm:left-0 h-32 sm:h-80 pointer-events-none"
        video.style = `
            max-height: 40vh;
            max-width: 300px;
            object-fit: contain;
            object-position: bottom;
            z-index: 101;
            transform: scaleX(-1) translateY(100%);
        `;
        video.setAttribute('playsinline', ''); // Advise against going fullscreen on play
        video.setAttribute('webkit-playsinline', ''); // For iOS webkit browsers
        video.setAttribute('id', 'narrator'); 
        video.style.transition = "all 600ms ease-in-out";

        if (window.innerWidth < small_break_width) {
            video.style.transform = "scaleX(1) translateY(100%)";
            video.style.right = '0';
            video.style.left = 'auto';
        }

        document.body.appendChild(video);

        // If the browser is Safari, hide video 
        if (isSafari) {
            video.classList.add("hidden");
        }

        const borderBottom = document.createElement('div');
        borderBottom.style.position = 'fixed';
        borderBottom.style.top = '0';
        borderBottom.style.left = '0';
        borderBottom.style.right = '0';
        borderBottom.style.height = '30px';
        borderBottom.style.width = '100vw';
        borderBottom.style.backgroundImage = 'url(https://static.mused.org/hmane_border_2.png)';
        borderBottom.style.backgroundRepeat = 'repeat-x';
        borderBottom.style.backgroundSize = 'contain';
        borderBottom.style.transform = "translateY(-100%)";
        borderBottom.style.transition = "all 1000ms ease-in-out";
        borderBottom.style['z-index'] = '100'; 
        borderBottom.setAttribute('id', 'hmane-border-bottom'); 
        document.body.appendChild(borderBottom);

        const borderTop = document.createElement('div');
        borderTop.style.position = 'fixed';
        borderTop.style.bottom = '0';
        borderTop.style.left = '0';
        borderTop.style.right = '0';
        borderTop.style.height = '40px';
        borderTop.style.width = '100vw';
        borderTop.style.backgroundImage = 'url(https://static.mused.org/hmane_border_1.png)';
        borderTop.style.backgroundRepeat = 'repeat-x';
        borderTop.style.backgroundSize = 'contain';
        borderTop.style.transform = "translateY(100%)";
        borderTop.style.transition = "all 1000ms ease-in-out";
        borderTop.style['z-index'] = '100'; 
        borderTop.setAttribute('id', 'hmane-border-top'); 
        document.body.appendChild(borderTop);


        const tourUIButtons = document.getElementById("tour-ui-buttons-inner");
        tourUIButtons.classList.remove("bottom-6");
        tourUIButtons.classList.add("bottom-16");

        const tourUIContent = document.getElementById("tour-ui-content-inner");
        tourUIContent.classList.remove("pb-28");
        tourUIContent.classList.add("pb-40");
        tourUIContent.classList.add("sm:pb-28");

        if (window.innerWidth < small_break_width) {
            const hudContainer = document.getElementById("hud-container");
            hudContainer.classList.add("hidden");
        }

    }


    onLoad () {
        const video = document.getElementById('narrator');
        const borderBottom = document.getElementById('hmane-border-bottom');
        const borderTop = document.getElementById('hmane-border-top');

        video.style.transform = "scaleX(-1)";
        if (window.innerWidth < small_break_width) {
            video.style.transform = 'scaleX(1)';
            video.style.right = '0';
            video.style.left = 'auto';
        }

        borderBottom.style.transform = "translateY(0%)";
        borderTop.style.transform = "translateY(0%)";

        const tourStartScreen = document.getElementById("tour-start-screen");
        tourStartScreen.classList.remove("loading-hidden");
        tourStartScreen.classList.remove("hidden");

        const tourUI = document.getElementById("tour-ui");
        tourUI.classList.add("hidden");

        // Find the start tour button by ID
        const startButton = document.getElementById('start-tour-button');
        if (startButton) {
            // Bind this.startTour to the click event of the button
            startButton.addEventListener('click', this.startTour.bind(this));
        }
    }

    startTour() {
        const { app } = Store.getState();

        // ugh have to do this because of audio 
        const tourStartScreen = document.getElementById("tour-start-screen");
        tourStartScreen.classList.add("loading-hidden");
        tourStartScreen.style.display = "none";

        const tourUI = document.getElementById("tour-ui");
        tourUI.classList.remove("hidden");

        // manually advance to first point
        app.tourUI.tourNavButtons.handleClickNext();

        const video = document.getElementById('narrator');
        video.style.transition = "";

    }

    handleChangeTourPoint(outgoingTourPoint, newTourPoint) {
        const { app, tourPointActiveIdx } = Store.getState();
        const video = document.getElementById('narrator');
        video.play();


        if (window.innerWidth > small_break_width) {
            if (newTourPoint.textPosition === "center") {
            }
            if (newTourPoint.textPosition === "right") {
                video.style.transform = 'scaleX(1)';
                video.style.right = '0';
                video.style.left = 'auto';
            }
            if (newTourPoint.textPosition === "left") {
                video.style.transform = 'scaleX(-1)';
                video.style.left = '0';
                video.style.right = 'auto';
            }
        }

        // Clear any existing timeouts before starting a new one
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null; // Reset the timeout ID
        }

        const tourPointTextMain = document.getElementById("tour-point-text-main");
        const pointText = newTourPoint.text; 
        this.displayTextInChunks(pointText, 170, tourPointTextMain);

        // setup temple for the right tour point when needed
        console.log("Tour point active index", tourPointActiveIdx);
        if (tourPointActiveIdx === 15) {
            if (!this.temple) {
                this.setupTemple();
            } else {
                this.temple.model.visible = true;
                this.temple.revealModel();
            }

        } else {
            if (this.temple) {
                this.temple.hide();
            }
        }
    }

    displayTextInChunks = (text, chunkSize, element) => {
        // Split the text into words
        const words = text.split(' ');
        let chunks = [];
        let currentChunk = words[0];

        // Group words into chunks of approximately 170 characters, respecting word boundaries
        for (let i = 1; i < words.length; i++) {
            if (currentChunk.length + words[i].length + 1 <= chunkSize) {
                currentChunk += ' ' + words[i];
            } else {
                chunks.push(currentChunk);
                currentChunk = words[i];
            }
        }
        // Add the last chunk
        chunks.push(currentChunk);

        // Function to update the element with the next chunk
        let currentChunkIndex = 0;
        const updateText = () => {
            if (currentChunkIndex < chunks.length) {
                element.innerHTML = `<p>${chunks[currentChunkIndex]}</p>`;
                currentChunkIndex++;
                // Schedule the next update
                this.timeoutId = setTimeout(updateText, 13000); // 13 seconds per chunk
                element.classList.add("opacity-0")
                element.classList.remove("animate__animated")
                element.classList.remove("animate__fadeIn")
                setTimeout(() => {
                    element.classList.remove("opacity-0")
                    element.classList.add("animate__animated")
                    element.classList.add("animate__fadeIn")
                }, 600);
            }
        };

        // Start the sequence
        updateText();
    }


    update() {
        if (this.temple) {
            this.temple.update();
        }
    }

    render() {
        if (this.temple) {
            if (this.temple.torch) {
               this.temple.torch.render(); 
            }
            if (this.temple.torch2) {
               this.temple.torch2.render(); 
            }
        }
    }
}