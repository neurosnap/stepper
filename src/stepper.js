'use strict';

/**
 * https://github.com/jeromeetienne/microevent.js
 */
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
      this.steps.push(step instanceof Step ? step : new Step(this, step));
    }
  };

  run(stepNum=0) {
    this.num = stepNum;
    return this;
  }

  uid(step) {
    return step.uid();
  };

  get(stepId) {
    if (!isNaN(stepId)) {
      if (stepId < this.steps.length && stepId >= 0) {
        return this.steps[stepId];
      }
    }

    var tmp_step = new Step(this, stepId);

    for (let i = 0; i < this.steps.length; i++) {
      let step = this.steps[i];
      if (this.uid(step) == stepId
          || step.uid() == stepId
          || this.equal(step, tmp_step)) {
            return step;
      }
    }

    return false;
  }

  get steps() {
    if (typeof this._steps === 'function') {
      return this._steps();
    }
    return this._steps;
  };

  /*set steps(the_list) {
    if (typeof the_list === 'function') {
      the_list = the_list.call(this);
    }

    let steps = [];
    for (let i = 0; i < the_list.length; i++) {
      let new_step = new Step(this, the_list[i]);
      let step_already_exists = this.indexOf(new_step);
      if (step_already_exists > -1) new_step = this.steps[step_already_exists];
      steps.push(new_step);
    }
    this._steps = steps;
  };*/

  get step() {
    return this._step;
  };

  set step(step) {
    var stepNum = this.indexOf(step);
    if (stepNum == -1) {
      throw new Error('Not in step list, add it first then set it to active');
    }

    this._step = this.steps[stepNum];
    this._num = stepNum;
    this.emit('beforeBegin', this.step, this.num);
    this.step._begin();
  };

  get num() {
    return this._num;
  };

  set num(stepNum) {
    if (stepNum >= this.steps.length) {
      this.end();
      return this;
    }
    this.step = this.steps[stepNum];
  };

  begin(step) {
    let stepNum = this.indexOf(step);
    if (stepNum == -1) stepNum = step;
    this.steps[stepNum]._begin();
    return this;
  };

  end() {
    this.status = 1;
    this.emit('finish');
    return this;
  };

  use(validator, objs) {
    let step_objs = [null];
    if (typeof objs !== 'undefined') {
      if (isNodeList(objs) || isArray(objs)) {
        step_objs = objs;
      } else {
        step_objs = [objs];
      }
    }

    let step;
    for (let i = 0; i < step_objs.length; i++) {
      if (validator instanceof Step === false) {
        step = new Step(this, validator, step_objs[i]);
        if (this.indexOf(step) > -1) return;
        this.steps.push(step);
      }
    }

    return this;
  };

  indexOf(check_step) {
    if (check_step instanceof Step === false) return false;

    for (let i = 0; i < this.steps.length; i++) {
      if (this.equal(check_step, this.steps[i])) return i;
    }

    return -1;
  };

  each(fn, reverse=false) {
    for (let i = 0; i < this.steps.length; i++) {
      fn.call(this, this.steps[i], 1);
    }
    return this;
  };

  equal(fstep, sstep) {
    return fstep.uid() == sstep.uid();
  };

  prev() {
    let prev = this.num - 1;
    if (prev < 0) return this;
    this.num = prev;
    return this;
  };

  validator(step) {
    return [false, null];
  }
}

class Step extends Event {
  constructor(stepper, validator, obj) {
    super();

    this._id = uuid();
    this._obj = obj;

    this.validator = validator || function(step, next) { next(); };
    this.status = 0;
    this.err = null;
    this.stepper = stepper;
    this.storage = null;
  };

  _begin() {
    this.stepper.emit('begin', this);
    this.emit('begin');

    let err, results = this.stepper.validator(this);
    if (err) {
      this.next(results);
      return this;
    }

    if (this.validator instanceof Stepper) {
      this.validator
        .on('finish', () => { this.next(); })
        .run();
      return this;
    }

    this.validator(this, this.next.bind(this));
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

    this.stepper.emit('success', this);
    this.emit('success');
    this.stepper.num = this.stepper.num + 1;
    return this;
  };

  use(fn, obj) {
    this.validator = fn;
    if (typeof obj !== 'undefined') {
      this._obj = obj;
    }
    return this;
  };

  store(data) {
    this.storage = data;
    this.stepper.emit('store', this);
    this.emit('store');
    return this;
  };

  get num() {
    return this.stepper.indexOf(this);
  };

  get obj() {
    return this._obj;
  };

  set obj(obj) {
    this._obj = obj;
    this.stepper.emit('obj', this);
    this.emit('obj');
  }

  uid() {
    return this._id;
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

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray#Polyfill
 */
function isArray(arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
};

/**
 * http://stackoverflow.com/a/7238344/1713216
 */
function isNodeList(nodes) {
  var stringRepr = Object.prototype.toString.call(nodes);

  return typeof nodes === 'object'
    && /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr)
    && nodes.hasOwnProperty('length')
    && (nodes.length === 0 || (typeof nodes[0] === "object" && nodes[0].nodeType > 0));
}

