// supporting dashboard script for location, etc

document.addEventListener('DOMContentLoaded', () => {
    const locationCard = document.getElementById('locationCard');
    const locationButton = document.getElementById('locationButton');
    const locationStatus = document.getElementById('locationStatus');
    const locationMessage = document.getElementById('locationMessage');
    const locationStateLabel = document.getElementById('locationStateLabel');
    const locationLatitude = document.getElementById('locationLatitude');
    const locationLongitude = document.getElementById('locationLongitude');
    const locationUpdated = document.getElementById('locationUpdated');

    if (
        !locationCard ||
        !locationButton ||
        !locationStatus ||
        !locationMessage ||
        !locationStateLabel ||
        !locationLatitude ||
        !locationLongitude ||
        !locationUpdated
    ) {
        return;
    }

    const workoutType = locationCard.dataset.workoutType || '';
    const defaultMessage = locationStatus.dataset.defaultMessage || 'Use your location to get a quick outdoor workout prompt.';

    const setLocationState = ({
        state,
        statusLabel,
        message,
        latitude = '--',
        longitude = '--',
        updated = '--'
    }) => {
        locationStatus.dataset.state = state;
        locationStateLabel.textContent = statusLabel;
        locationMessage.textContent = message;
        locationLatitude.textContent = latitude;
        locationLongitude.textContent = longitude;
        locationUpdated.textContent = updated;
    };

    const setButtonState = (isLoading, label) => {
        locationButton.disabled = isLoading;
        locationButton.textContent = label;
    };

    // random response!! 
    const getOutdoorSuggestion = (type) => {
        switch (type) {
            case 'Strength':
                return 'You are checked in. A brisk walk and a few drills would be a solid strength day warmup.';
            case 'Cardio':
                return 'You are checked in. This is a great moment for a jog outside.';
            case 'Flexibility':
                return 'You are checked in. A light meditation session outside would make a good recovery reset.';
            case 'Sports':
                return 'You are checked in. Look for an open court, field, or patch of grass and go play.';
            default:
                return 'You are checked in. Whatever, just go do something ig.';
        }
    };

    const formatCoordinate = (value, positiveLabel, negativeLabel) => {
        const direction = value >= 0 ? positiveLabel : negativeLabel;
        return `${Math.abs(value).toFixed(4)} deg ${direction}`;
    };

    const formatTimestamp = (date) => {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    const handleSuccess = (position) => {
        const { latitude, longitude } = position.coords;

        setLocationState({
            state: 'success',
            statusLabel: 'ready',
            message: getOutdoorSuggestion(workoutType) || defaultMessage,
            latitude: formatCoordinate(latitude, 'N', 'S'),
            longitude: formatCoordinate(longitude, 'E', 'W'),
            updated: formatTimestamp(new Date())
        });
        setButtonState(false, 'refresh location');
    };

    const handleError = (error) => {
        let message = 'We could not grab your location right now. Try again later.';
        let statusLabel = 'error';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access was denied.';
                statusLabel = 'permission denied';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Your location is unavailable right now.';
                break;
            case error.TIMEOUT:
                message = 'The location request timed out.';
                statusLabel = 'timed out';
                break;
            default:
                break;
        }

        setLocationState({
            state: 'error',
            statusLabel,
            message
        });
        setButtonState(false, 'try again');
    };

    if (!('geolocation' in navigator)) {
        setLocationState({
            state: 'error',
            statusLabel: 'unsupported',
            message: 'This browser does not support geolocation, so the outdoor check-in card cannot run here.'
        });
        setButtonState(true, 'not supported');
        return;
    }

    setLocationState({
        state: 'idle',
        statusLabel: 'idle',
        message: defaultMessage
    });

    locationButton.addEventListener('click', () => {
        setButtonState(true, 'checking...');
        setLocationState({
            state: 'loading',
            statusLabel: 'checking',
            message: 'Checking your current position now. This usually only takes a moment.'
        });

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        });
    });
});
