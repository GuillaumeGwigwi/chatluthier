const AudioManager = {
    audioContext: new (window.AudioContext || window.webkitAudioContext)(),
    activeBackgroundSound: null,
    soundFiles: null,
    type : null,
    categories: {
        background: {},
        ambiance: {},
        soundboard: {}
    },
    backgroudButton : null,

    fetchSoundFiles() {
        return fetch(`http://127.0.0.1:3000/list-sounds/${this.type}`)
            .then(response => response.json())
            .then(data => {
                this.soundFiles = data;
                if (!this.soundFiles.length) {
                    console.error('No sound files found.');
                }
                return this.soundFiles;
            })
            .catch(e => {
                console.error('Error fetching sound file list from server:', e);
                return null;
            });
    },

    backGroundSoundLoop()
    {
        const soundDirectory = this.type === 'exploration' ? 'assets/background/exploration/' : 'assets/background/battle/';
        const randomFile = this.soundFiles[Math.floor(Math.random() * this.soundFiles.length)];
        const url = soundDirectory + randomFile;
        const playSound = (file) => {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
    
            fetch(file)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    source.buffer = audioBuffer;
                    source.loop = false;
                    source.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    let volume = document.getElementById('music-volume').value;
                    gainNode.gain.value = volume / 100;
                    source.start(0);
    
                    source.onended = () => this.backGroundSoundLoop();

                    this.activeBackgroundSound = { source, gainNode };
                })
                .catch(e => console.error('Error with decoding audio data', e));
        };
            
        playSound(url);
    },

    async playBackgroundSound(type, button) {
        if (this.activeBackgroundSound) 
        {
            this.activeBackgroundSound.source.onended  = null;
            this.activeBackgroundSound.source.stop();
            this.activeBackgroundSound = null;
            this.backgroudButton.classList.remove('button-play');
            this.backgroudButton.classList.add('button-stop');
            if(type == this.type)
            return;
        }
        this.backgroudButton = button
        button.classList.add('button-play');
        button.classList.remove('button-stop');
        this.type = type;
        await this.fetchSoundFiles();
        if (!this.soundFiles) {
            console.error('Sound files not loaded.');
            return;
        }
    

    
        this.backGroundSoundLoop();

    },

    setBackgroundVolume(volume) {
        const gainValue = volume / 100;
        if (this.activeBackgroundSound && this.activeBackgroundSound.gainNode) {
            this.activeBackgroundSound.gainNode.gain.value = gainValue;
        }
    },

    toggleSound(url, loop, button, type) {
        let sound = this.categories[type][url];

        if (sound && sound.source) {
            sound.source.stop();
            delete this.categories[type][url];
            button.classList.remove('button-play');
            button.classList.add('button-stop');
        } else {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            fetch(url)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    source.buffer = audioBuffer;
                    source.loop = loop;
                    source.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    let volume = document.getElementById('ambiance-volume').value;
                    gainNode.gain.value = volume / 100;
                    source.start(0);

                    source.onended = () => {
                        delete this.categories[type][url];
                        button.classList.remove('button-play');
                        button.classList.add('button-stop');
                    };

                    this.categories[type][url] = { source, gainNode };
                    button.classList.add('button-play');
                    button.classList.remove('button-stop');
                })
                .catch(e => console.error('Error with decoding audio data', e));
        }
    },

    setVolume(type, volume) {
        const gainValue = volume / 100;
        Object.values(this.categories[type]).forEach(sound => {
            if (sound.gainNode) {
                sound.gainNode.gain.value = gainValue;
            }
        });
    },
    generateButtons(soundFiles, sectionId, loop) {
        const section = document.getElementById(sectionId);
        section.innerHTML = ''; // Clear existing content


        soundFiles.forEach(file => {
            const fileName = file.replace('.mp3', '');
            const button = document.createElement('button');
            button.textContent = `${fileName}`;
            button.onclick = () => AudioManager.toggleSound(`assets/${sectionId}/${file}`, loop, button, sectionId);
            button.classList.add('button-stop', 'button');
            section.appendChild(button);
        });
    },
       
}