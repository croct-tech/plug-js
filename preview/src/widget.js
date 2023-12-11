window.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('widget');

    if (widget === null) {
        return;
    }

    function postMessage(event, data) {
        window.parent.postMessage({type: `croct:preview:${event}`, ...data}, '*');
    }

    function addButtonClickListener(element, callback) {
        element.addEventListener('click', callback);
        element.addEventListener('keydown', event => {
            switch (event.code) {
                case 'Enter':
                case 'Space':
                    callback(event);

                    break;
            }
        });
    }

    const disclosure = document.getElementById('disclosure');
    const minimizeButton = document.getElementById('minimize-button');
    const leaveButton = document.getElementById('leave-button');

    widget.addEventListener('animationend', () => {
        switch (widget.getAttribute('data-expanded')) {
            case 'true':
                widget.removeAttribute('data-expanding');
                minimizeButton.focus();

                break;

            case 'false':
                widget.removeAttribute('data-minimizing');
                disclosure.focus();

                break;
        }
    });

    addButtonClickListener(disclosure, () => {
        if (widget.getAttribute('data-expanded') !== 'true') {
            widget.setAttribute('data-expanded', 'true');
            widget.setAttribute('data-expanding', 'true');
            disclosure.setAttribute('aria-expanded', 'true');
            minimizeButton.setAttribute('aria-expanded', 'true');
            minimizeButton.focus();
        }
    });

    addButtonClickListener(minimizeButton, () => {
        if (widget.getAttribute('data-expanded') === 'true') {
            widget.setAttribute('data-expanded', 'false');
            widget.setAttribute('data-minimizing', 'true');
            disclosure.setAttribute('aria-expanded', 'false');
            minimizeButton.setAttribute('aria-expanded', 'false');
            disclosure.focus();
        }
    });

    addButtonClickListener(leaveButton, () => {
        postMessage('leave');
    });

    document.addEventListener('keydown', event => {
        if (event.code === 'Escape') {
            minimizeButton.click();
        }
    });

    function onLoad() {
        const observer = new ResizeObserver(() => {
            postMessage('resize', {
                width: widget.parentElement.offsetWidth,
                height: widget.parentElement.offsetHeight,
            });
        });

        observer.observe(widget);

        // Ensure the transition is applied
        window.setTimeout(() => widget.classList.add('loaded'), 100);
    }

    document.fonts
        .ready
        .then(onLoad);

    function renderExperience(previewMode, experience) {
        if(previewMode === 'slotDefaultContent') {
            document.getElementById('preview-experience')
                .closest('li')
                .remove();

            return;
        }

        document.getElementById('preview-experience').textContent = experience;
    }

    function renderAudience(previewMode, audience) {
        if(previewMode === 'slotDefaultContent') {
            document.getElementById('preview-audience').textContent = 'None';

            return;
        }

        document.getElementById('preview-audience').textContent = audience;
    }

    function renderExperiment(previewMode, variant, experiment) {
        if (previewMode === 'slotDefaultContent' || variant === null) {
            document.getElementById('preview-experiment')
                .closest('li')
                .remove();

            return;
        }

        document.getElementById('preview-experiment').textContent = experiment;
    }

    function renderContent(previewMode, variant) {
        if (previewMode === 'slotDefaultContent' || variant === null) {
            return;
        }

        document.getElementById('preview-content').textContent = variant;
    }

    function renderLocale(locale) {
        if (locale === null) {
            document.getElementById('preview-locale')
                .closest('li')
                .remove();

            return;
        }

        let localeName = locale;

        try {
            const formatter = new Intl.DisplayNames(['en-us'], {type: 'language'});

            localeName = `${formatter.of(locale)} <span class="detail">(${locale})</span>`;
        } catch (error) {
            // Ignore
        }

        document.getElementById('preview-locale').innerHTML = localeName;
    }

    const params = new URLSearchParams(window.location.search);

    const previewMode = params.get('previewMode');
    const experience = params.get('experience');
    const audience = params.get('audience');
    const experiment = params.get('experiment');
    const variant = params.get('variant');
    const locale = params.get('locale');

    renderExperience(previewMode, experience);

    renderAudience(previewMode, audience);

    renderExperiment(previewMode, variant, experiment);

    renderContent(previewMode, variant);

    renderLocale(locale);
});
