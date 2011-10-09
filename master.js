var SS = function () {
    document.addEventListener('keydown', _.bind(this.keydown, this), false);
    document.addEventListener('keypress', _.bind(this.keypress, this), false);
    document.addEventListener('keyup', _.bind(this.keyup, this), false);
    document.addEventListener('touchstart', _.bind(this.touchstart, this), false);
    window.addEventListener('hashchange', _.bind(this.readUrl, this), false);

    this.currentSection = 0;
    this.currentSlide = 0;

    this.sections = _.toArray(document.querySelectorAll('body > header,body > article,body > footer'));

    if (!this.sections.length) {
        throw 'No slides found';
    }

    this.articles = [];
    this.sections.map(_.bind(function (el) {
        this.articles.push(_.toArray(el.querySelectorAll('header, section, footer')));
    }, this));

    var form = document.createElement('form'),
        toc = document.createElement('section'),
        tree = [],
        str = '';
    form.setAttribute('method', 'get');
    form.setAttribute('id', 'goto');
    form.innerHTML = '<h1>Go To Slide</h1>' +
        '<ul>' +
            '<li>' +
                '<label for="section">Section</label>' +
                '<input type="number" min="1" max="' + this.sections.length + '" value="1" step="1" name="section" id="section">' +
            '</li>' +
            '<li>' +
                '<label for="slide">Slide</label>' +
                '<input type="number" min="1" value="1" step="1" name="slide" id="slide">' +
           ' </li>' +
        '</ul>' +
        '<button type="submit">Go</button>';
    form.setAttribute('class', 'hidden');
    document.body.appendChild(form);
    form.addEventListener('submit', _.bind(this.formSubmit, this), false);

    toc.setAttribute('id', 'toc');
    str = '';

    _.each(this.sections, function (section, index) {
        var subs = _.map(_.toArray(section.querySelectorAll('section h1')), function (el) {
            return el.textContent;
        });

        str += '<li><a href="#!/section/' + index + '/slide/0">' + section.querySelector('h1:first-of-type').textContent + '</a>';
        _.each(subs, function (subhead, subindex) {
            if (subindex === 0) {
                str += '<ol>'
            }

            str += '<li><a href="#!/section/' + index + '/slide/' + (subindex + 1) + '">' + subhead + '</a></li>'

            if (subindex + 1 === subs.length) {
                str += '</ol>'
            }
        });
        str += '</li>';
    });
    toc.innerHTML = '<h1>Table of Contents</h1><ol>' + str + '</ol>';
    toc.setAttribute('class', 'hidden');
    document.body.appendChild(toc);

    this.readUrl();
};
SS.prototype = {
    advance: function (count) {
        var section = this.currentSection,
            articles = this.articles[section],
            article = this.currentSlide + count;

        if ((section === 0 && article < 0) || (section === this.sections.length - 1 && article > articles.length - 1)) {
            return;
        }

        if (count > 0 && (!articles.length || articles.length <= article)) {
            section += 1;
            article = 0;
        } else if (article <= -1) {
            section -= 1;
            article = this.articles[section].length - 1;
        }

        this.navigateTo(section, article);
    },

    navigateTo: function (section, article) {
        this.hideModal();

        var index;

        function setClasses(els, curIndex) {
            var index = Math.max(Math.min(curIndex, els.length - 1), 0);
            els[index].setAttribute('class', 'present');
            els.slice(0, index).map(function (el) {
                el.setAttribute('class', 'past');
            });
            els.slice(index + 1).map(function (el) {
                el.setAttribute('class', 'future');
            });
            return index;
        }

        index = setClasses(this.sections, section);
        this.currentSection = index;
        if (this.articles[index].length) {
            this.currentSlide = setClasses(this.articles[index], article);
        }

        window.history.pushState({}, '', window.location.href.replace(/\#\!\/section\/\d+\/slide\/\d+$/, '') + '#!/section/' + this.currentSection + '/slide/' + this.currentSlide);
    },

    readUrl: function () {
        var hash = window.location.hash.match(/\#\!\/section\/(\d+)\/slide\/(\d+)$/),
            section = 0,
            slide = 0;

        if (hash && hash.length === 3) {
            section = hash[1];
            slide = hash[2];
        }

        this.navigateTo(section, slide);
    },

    keydown: function (event) {
        if (event.metaKey) {
            return;
        }

        switch (event.keyCode) {
        case 37:
        case 38:
            this.advance(-1);
            break;
        case 39:
        case 40:
            this.advance(1);
            break;
        default:
            return;
        }
        event.preventDefault();
    },

    keypress: function (event) {
        if (event.metaKey) {
            return;
        }

        switch (event.charCode || event.keyCode) {
        case 101: // e: end
            this.navigateTo(this.sections.length - 1, 0);
            break;
        case 103: // g: goto
            this.showModal('goto');
            var form = document.querySelector('#goto');
            form.querySelector('#section').value = this.currentSection + 1;
            form.querySelector('#section').focus();
            form.querySelector('#slide').value = this.currentSlide + 1;
            break;
        case 110: // n: next section
            this.navigateTo(this.currentSection + 1, 0);
            break;
        case 112: // p: previous section
            this.navigateTo(this.currentSection - 1, 0);
            break;
        case 115: // s: start
            this.navigateTo(0, 0);
            break;
        case 116: // t: toc
            this.showModal('toc');
            break;
        default:
            return;
        }

        event.preventDefault();
    },

    keyup: function (event) {
        if (event.metaKey) {
            return;
        }

        switch (event.keyCode) {
        case 27:
            this.hideModal();
            break;
        default:
            return;
        }

        event.preventDefault();
    },

    showModal: function (id) {
        var modal = document.querySelector('#' + id);
        modal.setAttribute('class', 'show');
    },

    hideModal: function () {
        var modal = document.querySelector('.show'),
            ended = false;

        function finished(event) {
            if (ended) {
                return;
            }
            ended = true;
            modal.setAttribute('class', 'hidden');
            modal.removeEventListener('webkitTransitionEnd', finished, false);
            modal.removeEventListener('mozTransitionEnd', finished, false);
            modal.removeEventListener('msTransitionEnd', finished, false);
            modal.removeEventListener('oTransitionEnd', finished, false);
            modal.removeEventListener('transitionend', finished, false);
        }

        if (modal) {
            modal.addEventListener('webkitTransitionEnd', finished, false);
            modal.addEventListener('mozTransitionEnd', finished, false);
            modal.addEventListener('msTransitionEnd', finished, false);
            modal.addEventListener('oTransitionEnd', finished, false);
            modal.addEventListener('transitionend', finished, false);
            modal.setAttribute('class', '');
        }
    },

    formSubmit: function (event) {
        event.preventDefault();

        var form = document.querySelector('#goto'),
            section = parseInt(form.querySelector('#section').value, 10) - 1,
            slide = parseInt(form.querySelector('#slide').value, 10) - 1;

        this.navigateTo(section, slide);

        this.hideModal();
    },

    touchstart: function (event) {
        if (event.touches.length !== 1) {
            return;
        }

        event.preventDefault();

        var touch = event.touches[0],
            wt = window.innerWidth * 0.3,
            ht = window.innerHeight * 0.3;

        if (touch.clientX < wt) {
            this.navigateTo(this.currentSection - 1, 0);
        } else if (touch.clientX > window.innerWidth - wt) {
            this.navigateTo(this.currentSection + 1, 0);
        } else if (touch.clientY < ht) {
            this.navigateTo(this.currentSection, this.currentSlide - 1);
        } else if (touch.clientY > window.innerHeight - ht) {
            this.navigateTo(this.currentSection, this.currentSlide + 1);
        }
    }
};

document.addEventListener('DOMContentLoaded', function (event) {
    SS.instance = new SS();
}, false);
