'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace();

    this._setDescription();
  }

  // min/km
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  //km/h
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//Application Architecture
class App {
  #map;
  #mapE;
  #workouts = [];
  workout;
  mark;
  #mapZoom = 13;
  constructor() {
    // get user postiion
    this._getPosition();

    // render localstorge workouts
    this._getLocalStorage();

    // adding event handlers
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        console.log(`Your location can not be fetched`);
      });
    }
  }
  _loadMap(position) {
    let { latitude } = position.coords;
    let { longitude } = position.coords;
    const coords = [latitude, longitude];

    // console.log(latitude, longitude);
    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      // this._renderWorkout(work);
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    // console.log(mapEvent);
    this.#mapE = mapE;
    const { lat, lng } = this.#mapE.latlng;

    // L.marker([lat, lng]).addTo(map).bindPopup('test').openPopup();

    // this._renderWorkoutMarker([lat, lng]);

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    //if (this.#workouts.length > 0) form.classList.add('hidden'); // enough code for  hideout animation (looks good)

    // for instant replacement if the form by the new WI

    if (this.#workouts.length > 0) {
      form.style.display = 'none';
      form.classList.add('hidden');
      setTimeout(() => (form.style.display = 'grid'), 1000);
    }
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    //get Data from form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapE.latlng;
    // let workout;

    const validInputs = (...inputs) => {
      return inputs.every(inp => Number.isFinite(inp));
    };

    const allPositive = (...inputs) => {
      return inputs.every(inp => inp > 0);
    };

    if (type === 'running') {
      const cadence = Number(inputCadence.value);

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        alert('Inputs should be positive numbers');
        return;
      }

      this.workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        alert('Inputs should be positive numbers');
        return;
      }
      this.workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(this.workout);
    this._renderWorkoutMarker(this.workout);

    console.log(this.#workouts);

    // this.mark
    //   .bindPopup(
    //     L.popup({
    //       maxWidth: 250,
    //       minWidth: 100,
    //       autoClose: false,
    //       closeOnClick: false,
    //       className: `${type}-popup`,
    //     })
    //   )
    //   .setPopupContent(
    //     `${this.workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
    //       this.workout.description
    //     }`
    //   )
    //   .openPopup();

    /// render workout list
    this._renderWorkout(this.workout);

    this._hideForm();

    // store all workouts in localStorage
    this._setLocalStorage();
  }

  // _renderWorkoutMarker([lat, lng]) {
  //   this.mark = L.marker([lat, lng])
  //     .addTo(this.#map)
  //
  // }

  _renderWorkoutMarker(workout) {
    this.mark = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          
    `;

    if (workout.type === 'running')
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
     `;

    if (workout.type === 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
     `;

    // console.log(html);

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workOutE1 = e.target.closest('.workout');

    if (!workOutE1) return;

    const workout = this.#workouts.find(
      work => work.id === workOutE1.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoom, {
      animation: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click(); // by converting object to String , then again String to Object the prototype property is removed

    // console.log(workOutE1);
    // console.log(workout);
  }

  _setLocalStorage() {
    localStorage.setItem('workItems', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workItems'));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      // this._renderWorkoutMarker(work.coords);
    });
  }

  reset() {
    localStorage.removeItem('workItems');
    location.reload();
  }
}

const firstMap = new App();
