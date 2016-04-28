/**
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 * Copyright 2016 Klokan Technologies Gmbh (www.klokantech.com)
 */
goog.provide('klokantech.jekylledit.Popup');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('klokantech.jekylledit.Auth');
goog.require('klokantech.jekylledit.utils');



/**
 * @param {string} repo
 * @param {string} path
 * @constructor
 */
klokantech.jekylledit.Popup = function(repo, path) {
  /**
   * @type {string}
   * @private
   */
  this.repo_ = repo;

  /**
   * @type {string}
   * @private
   */
  this.path_ = path;

  /**
   * @type {!Element}
   * @private
   */
  this.content_ = goog.dom.createDom(goog.dom.TagName.DIV, 'je-popup-content');

  /**
   * @type {!Element}
   * @private
   */
  this.actions_ = goog.dom.createDom(goog.dom.TagName.DIV, 'je-popup-actions');

  /**
   * @type {!Element}
   * @private
   */
  this.element_ = goog.dom.createDom(goog.dom.TagName.DIV, 'je-popup');

  /**
   * @type {!Element}
   * @private
   */
  this.nav_ = goog.dom.createDom(goog.dom.TagName.DIV, 'je-popup-nav');

  /**
   * @type {!Element}
   * @private
   */
  this.side_ = goog.dom.createDom(goog.dom.TagName.DIV, 'je-popup-side');

  goog.dom.append(this.element_, this.nav_, this.content_,
                  this.side_, this.actions_);

  /**
   * @type {!Element}
   * @private
   */
  this.root_ = goog.dom.createDom(goog.dom.TagName.DIV, 'je-popup-bg',
                                  this.element_);

  /**
   * @type {Object}
   * @private
   */
  this.editor_ = null;

  /**
   * @type {Node}
   * @private
   */
  this.editSource_ = null;

  /**
   * @type {Object}
   * @private
   */
  this.config_ = null;

  /**
   * @type {Object}
   * @private
   */
  this.postData_ = null;

  /**
   * @type {klokantech.jekylledit.Auth}
   * @private
   */
  this.auth_ = new klokantech.jekylledit.Auth(this.content_);
  this.auth_.login(goog.bind(this.onLogin_, this));
};


/**
 * @private
 */
klokantech.jekylledit.Popup.prototype.onLogin_ = function() {
  this.loadConfig();
  this.startEditor_();

  var editBtn = goog.dom.createDom(goog.dom.TagName.DIV, 'je-btn', 'Edit');
  goog.dom.append(this.nav_, editBtn);
  //goog.events.listen(editBtn, goog.events.EventType.CLICK, function(e) {
  // this.setVisible(false);
  //}, false, this);

  var saveBtn = goog.dom.createDom(goog.dom.TagName.DIV, 'je-btn', 'Save');
  var cancelBtn = goog.dom.createDom(goog.dom.TagName.DIV, 'je-btn', 'Cancel');
  goog.dom.append(this.actions_, cancelBtn, saveBtn);
  goog.events.listen(cancelBtn, goog.events.EventType.CLICK, function(e) {
    this.setVisible(false);
  }, false, this);
  goog.events.listen(saveBtn, goog.events.EventType.CLICK, function(e) {
    this.save();
  }, false, this);
};


/**
 * @param {boolean} visible
 */
klokantech.jekylledit.Popup.prototype.setVisible = function(visible) {
  if (visible) {
    goog.dom.appendChild(document.body, this.root_);
    document.body.style.overflow = 'hidden';
  } else {
    goog.dom.removeNode(this.root_);
    document.body.style.overflow = '';
  }
};


/**
 */
klokantech.jekylledit.Popup.prototype.loadConfig = function() {
  this.auth_.sendRequest(
      this.repo_ + '/config.json',
      goog.bind(function(e) {
        var xhr = e.target;
        this.config_ = xhr.getResponseJson();

        goog.object.forEach(this.config_['metadata'], function(el, k) {
          var catBtn = goog.dom.createDom(goog.dom.TagName.DIV, 'je-btn',
          'New: ' + k);
          goog.dom.appendChild(this.nav_, catBtn);
        }, this);

        this.loadAttributes();
      }, this));
};


/**
 */
klokantech.jekylledit.Popup.prototype.loadAttributes = function() {
  goog.dom.removeChildren(this.side_);

  this.auth_.sendRequest(
      this.repo_ + '/edit/' + this.path_,
      goog.bind(function(e) {
        var xhr = e.target;
        var data = xhr.getResponseJson();
        this.postData_ = data;

        var type = data['type'];

        var fields = (this.config_['metadata'][type] || {})['fields'] || {};

        goog.object.forEach(fields, function(el, k) {
          var label = goog.dom.createDom(goog.dom.TagName.LABEL, {}, k + ':');
          var inputType = 'text';
          var inputValue = (data[k] || el['value']).toString();
          if (el['type'] == 'datetime') {
            inputType = 'datetime-local';
            inputValue = inputValue.split('-').slice(0, 3).join('-');
          }
          var dataInput = goog.dom.createDom(goog.dom.TagName.INPUT, {
            type: inputType,
            value: inputValue
          });
          el['_je_input'] = dataInput;
          goog.dom.append(this.side_, label, dataInput);
        }, this);

        goog.object.forEach(data, function(el, k) {
          if (!fields[k]) {
            var label = goog.dom.createDom(goog.dom.TagName.LABEL, {}, k + ':');
            var dataInput = goog.dom.createDom(goog.dom.TagName.DIV, {},
            data[k].toString());
            goog.dom.append(this.side_, label, dataInput);
          }
        }, this);
      }, this));
};


/**
 * @param {Node} content
 */
klokantech.jekylledit.Popup.prototype.setEditableContent = function(content) {
  this.editSource_ = content;
};


/**
 * @private
 */
klokantech.jekylledit.Popup.prototype.startEditor_ = function() {
  klokantech.jekylledit.utils.cloneNodes(this.editSource_, this.content_);
  klokantech.jekylledit.utils.installStyle(
      'https://cdnjs.cloudflare.com/ajax/libs/medium-editor/' +
      '5.16.1/css/medium-editor.min.css');
  klokantech.jekylledit.utils.installStyle(
      'https://cdnjs.cloudflare.com/ajax/libs/medium-editor/' +
      '5.16.1/css/themes/default.min.css');
  klokantech.jekylledit.utils.installScript(
      'https://cdnjs.cloudflare.com/ajax/libs/to-markdown/' +
      '3.0.0/to-markdown.min.js');
  klokantech.jekylledit.utils.installScript(
      'https://cdnjs.cloudflare.com/ajax/libs/medium-editor/' +
      '5.16.1/js/medium-editor.min.js', goog.bind(function() {
        if (this.editor_) {
          this.editor_['destroy']();
        }
        this.editor_ = new goog.global['MediumEditor'](
        goog.dom.getElementsByTagNameAndClass(
        undefined, 'editable', this.content_),
        {
          'toolbar': {
            'buttons': [
              'bold', 'italic', 'underline', 'orderedlist', 'unorderedlist',
              'anchor', 'h2', 'h3', 'removeFormat'
            ]
          }
        });
      }, this));
};


/**
 */
klokantech.jekylledit.Popup.prototype.save = function() {
  var editables = goog.dom.getElementsByTagNameAndClass(
                      undefined, 'editable', this.content_);

  goog.array.forEach(editables, function(el) {
    var md = goog.global['toMarkdown'](el.innerHTML);
    console.log(el.getAttribute('data-jekylledit-source'), md);
    klokantech.jekylledit.utils.cloneNodes(this.content_, this.editSource_);
    this.setVisible(false);
  }, this);

  if (this.postData_) {
    var type = this.postData_['type'];

    var fields = (this.config_['metadata'][type] || {})['fields'] || {};

    var result = {};

    goog.object.forEach(fields, function(el, k) {
      var dataInput = el['_je_input'];
      if (dataInput) {
        result[k] = dataInput.value;
      }
    }, this);

    console.log(result);
  }
};
