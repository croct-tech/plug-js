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

    const params = new URLSearchParams(window.location.search);

    if (params.has('experience')) {
        document.getElementById('preview-experience').textContent = params.get('experience');
    }

    if (params.has('audience')) {
        document.getElementById('preview-audience').textContent = params.get('audience');
    }

    if (params.has('locale')) {
        document.getElementById('preview-locale').textContent = params.get('locale');
    }

    if (params.has('variant')) {
        if (params.has('experiment')) {
            document.getElementById('preview-experiment').textContent = params.get('experiment');
        }

        document.getElementById('preview-content').textContent = params.get('variant');
    } else {
        document.getElementById('preview-experiment')
            .closest('li')
            .remove();
    }
});
