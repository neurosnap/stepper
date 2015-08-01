'use strict';

class Event {
  constructor() {
    this._events = {};
  };

  on(event, callback) {
    this._events[event] = this._events[event] || [];
    this._events[event].push(callback);
    return this;
  };

  off(event, callback) {
    if (!(event in this._events)) return;
    this._events[event].splice(this._events[event].indexOf(callback), 1);
    return this;
  };

  emit(event, ...args) {
    if (!(event in this._events)) return;
    for (var i = 0; i < this._events[event].length; i++) {
      this._events[event][i].call(this, ...args);
    }
    return this;
  };
}

export default class Stepper extends Event {
  constructor(options, ...args) {
    super();

    assign(this, options);
    this.status = 0;
    this._steps = [];
    this._step;
    this._num = 0;

    for (let i = 0; i < args.length; i++) {
      var step = args[i];
      this._steps.push(step instanceof Step ? step : new Step(this, step));
    }
  };

  run(stepNum=0) {
    this.num = stepNum;
    return this;
  }

  get(stepId) {
    if (!isNaN(stepId)) {
      if (stepId < this._steps.length && stepId >= 0) {
        return this._steps[stepId];
      }
    }

    for (let i = 0; i < this._steps.length; i++) {
      let step = this._steps[i];
      if (step.id == stepId) return step;
    }

    return false;
  }

  get step() {
    return this._step;
  };

  set step(step) {
    var stepNum = this.indexOf(step);
    if (stepNum == -1) {
      throw new Error('Not in step list, add it first then set it to active');
    }

    this._step = this._steps[stepNum];
    this._num = stepNum;
    this.emit('beforeBegin', this.step, this.num);
    this.step._begin();
  };

  get num() {
    return this._num;
  };

  set num(stepNum) {
    if (stepNum >= this._steps.length) {
      this.end();
      return this;
    }
    this.step = this._steps[stepNum];
  };

  begin(step) {
    let stepNum = this.indexOf(step);
    if (stepNum == -1) stepNum = step;
    this._steps[stepNum]._begin();
    return this;
  };

  end() {
    this.status = 1;
    this.emit('allEnd');
    return this;
  };

  use(new_step) {
    if (new_step instanceof Step === false) {
      new_step = new Step(this, new_step);
    }

    if (this.indexOf(new_step) > -1) return;

    this._steps.push(new_step);
    return new_step;
  };

  indexOf(check_step) {
    if (check_step instanceof Step === false) return false;

    for (let i = 0; i < this._steps.length; i++) {
      if (this.equal(check_step, this._steps[i])) return i;
    }

    return -1;
  };

  each(fn, reverse=false) {
    for (let i = 0; i < this._steps.length; i++) {
      fn.call(this, this._steps[i], 1);
    }
    return this;
  };

  equal(fstep, sstep) {
    return fstep._id == sstep._id;
  };

  prev() {
    let prev = this.num - 1;
    if (prev < 0) return this;
    this.num = prev;
    return this;
  };
}

class Step extends Event {
  constructor(stepper, validator=function(next) { next(); }) {
    super();
    this._id = uuid();
    this.status = 0;
    this.err = null;
    this.stepper = stepper;
    this.validator = validator;
  };

  _begin() {
    this.stepper.emit('begin', this);
    this.emit('end');
    if (this.validator instanceof Stepper) {
      this.validator
        .on('allEnd', () => { this.next(); })
        .run();
      return this;
    }
    this.validator(this.next.bind(this));
    return this;
  };

  next(err) {
    if (err) {
      this.status = -1;
      this.err = err;
      this.stepper.emit('error', this.err, this);
      this.emit('error', this.err);
      return this;
    }
    this.status = 1;
    this.err = null;

    this.stepper.emit('end', this);
    this.emit('end');
    this.stepper.num = this.stepper.num + 1;
    return this;
  };

  get num() { return this.stepper.indexOf(this); };

  get data() {
    return this._data;
  };

  set data(obj) {
    this._data = obj;
    this.stepper.emit('data', this);
    this.emit('data');
  }
}

function assign(ctx, obj, deep=true) {
  for (let key in obj) {
    if (deep && typeof obj[key] === 'object') {
      if (typeof ctx[key] === 'undefined') {
        ctx[key] = {};
      }
      assign(ctx[key], obj[key]);
    } else {
      ctx[key] = obj[key];
    }
  }
}

/**
 * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript?page=2&tab=votes#tab-top
 */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
