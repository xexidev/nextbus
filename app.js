import txt from './namespace.js';
import config from './config.js';

window.addEventListener('load', () => {

    //Set variables
    const welcomeMessage = document.querySelector('.welcome')
    const linesSelectHMTL = document.querySelector('.linesSelect')
    const stopsSelectHMTL = document.querySelector('.stopsSelect')
    const lineInfoBox = document.querySelector('.lineInfoBox')
    const display = document.querySelector('.display')
    const timerBox = document.querySelector('.timer')

    // MAIN FUNCTIONS
    
    // Main
    function main() {
        setLines()
    }
    main()

    /*
    Set Bus Lines
    - Fetches Bus Line Data
    - Builds a new array with Bus Lines and it's relevant information
    - Renders the <select> with the Bus Lines, including it's info in the data attributes of each <option>
    - Adds an event listener on the <select> to call setStops() on change
    */
    function setLines() {
        let linesURL = `https://api.tmb.cat/v1/transit/linies/bus?app_id=${config.apiId}&app_key=${config.apiKey}`
        fetchData(linesURL)
        .then(data => {
            const lines = buildLinesArray(data)
            const sortedLines = sortArray(lines,'lineCode')
            renderSelectHTML(sortedLines,linesSelectHMTL,txt.selectBusLine,createLineOptionElement)
            linesSelectHMTL.addEventListener('change', setStops)
        })
        .catch(error => {
            showError(txt.errorSettingLines,error)
        })
    }

    /*
    Set Bus Stops for the selected Bus Line
    - Hides the welcome message, the Bus arrival countdown, and shows the selected Bus Line Info
    - Gets the line code from the data-lineCode attribute of the selected line <option>
    - Fecthes the Bus Stops data
    - Builds a new array with Bus Stops and it'srelevant information
    - Adds an event listener on the <select> to call setCountdown() on change
    */
    function setStops() {
        hideWelcomeMessage()
        hideCountdown()
        expandLineInfoBox()
        let selectedLine = (linesSelectHMTL.selectedOptions[0].dataset.lineCode)    
        let stopsURL = `https://api.tmb.cat/v1/transit/linies/bus/${selectedLine}/parades?app_id=${config.apiId}&app_key=${config.apiKey}`
        fetchData(stopsURL)
        .then(data => {
            const stops = buildStopsArray(data)
            const sortedStops = sortArray(stops,'stopCode')
            renderSelectHTML(sortedStops,stopsSelectHMTL,txt.selectBusStop,createStopOptionElement)
            stopsSelectHMTL.addEventListener('change', setCountdown)
        })
        .catch(error => {
            showError(txt.errorSettingStops,error)
        })
    }

    /*
    Sets the countdown with the remaning time
    - Sets the variables for the intervals used and for the remaining seconds to the bus for arrive
    - Fetches de data with the time remaining in seconds, using the datasets lineCode and stopCode from the selected <option>
    - The API updates this data every 10 seconds
    - This function works in two steps, with one setInterval() in each
    -- First setInterval() named remainingTimeInterval fires getRemainingTime() wich fetches the data every given time and updates the remainingSeconds variable
    -- Then getRemainingTime() fires a setInterval() of 1 second named onSecondInterval that fires renderTimer()
    -- In each one second interval, renderTimer() substracts 1 from the remainingSeconds variable
    -- The value in seconds is coverted to mm:ss and rendered into te DOM, creating the illusion of a real-time countdown
    */
    let remainingTimeInterval
    let oneSecondInterval
    let remainingSeconds

    function setCountdown() {
        clearInterval(remainingTimeInterval)
        let interval = 15000
        let selectedLine = (stopsSelectHMTL.selectedOptions[0].dataset.lineCode)        
        let selectedStop = (stopsSelectHMTL.selectedOptions[0].dataset.stopCode)    
        getRemainingTime(selectedLine,selectedStop)
        remainingTimeInterval = setInterval(() => getRemainingTime(selectedLine,selectedStop), interval)
        expandCountdown()
    }

    function getRemainingTime(selectedLine,selectedStop) {
        clearInterval(oneSecondInterval)
        let remainingTimeURL = `https://api.tmb.cat/v1/ibus/lines/${selectedLine}/stops/${selectedStop}?app_id=${config.apiId}&app_key=${config.apiKey}`
        fetchData(remainingTimeURL)
        .then(data => {
            if(data.data.ibus[0] != undefined) {
                remainingSeconds = data.data.ibus[0]['t-in-s']
            } else {
                remainingSeconds = `No data`
            }
            renderTime()
            oneSecondInterval = setInterval(() => renderTime(), 1000)
        })
        .catch(error => {
            showError(txt.errorSettingCountdown,error)
        })
    }

    function renderTime() {
        if(!isNaN(remainingSeconds)) {
            --remainingSeconds
            if(remainingSeconds >= 0) {
                timerBox.innerHTML = `${secToMinSec(remainingSeconds).min}:${secToMinSec(remainingSeconds).sec}`
            } else {
                timerBox.innerHTML = `0:00`
            }
        } else {
            timerBox.innerHTML = remainingSeconds
        }
        setBusPosition(remainingSeconds) // Updates the arriving bus animation
    }

    // UTILITY FUNCTIONS
    
    // Data Fetcher
    function fetchData(url) {
        return fetch(url)
        .then(res => {
            if(!res.ok) {
                throw new Error('Fetch error')
            }
            return res.json()
        })
    }

    // Array Sorter
    function sortArray(array,propertyToCompare) {
        return array.sort((a,b) => {
            return a[propertyToCompare].localeCompare(b[propertyToCompare], undefined, {
                numeric: true,
                sensitivity: 'base'
            })
        })
    }

    // Render Select
    function renderSelectHTML(array,htmlContainer,defaultOptionText,optionCreationFunction) {
        
        // Set the first option, selected and disabled
        let defaultOption = document.createElement('option')
        defaultOption.innerHTML = defaultOptionText
        defaultOption.setAttribute('disabled','true')
        defaultOption.setAttribute('selected','true')
        htmlContainer.appendChild(defaultOption)

        // Render Line Select HTML
        array.forEach(element => {
            htmlContainer.appendChild(optionCreationFunction(element))
        })
    }

    // BUS LINE FUNCTIONS

    // Bus Line Array Builder
    function buildLinesArray(data) {
        return data.features.map(line => ({
            'lineName': line.properties.NOM_LINIA, 
            'lineCode': line.properties.CODI_LINIA.toString(), 
            'calendarCode': line.properties.CODI_TIPUS_CALENDARI,
            'operativeDays': getOperativeDays(line.properties.CODI_TIPUS_CALENDARI)[0],
            'operativeDaysText': getOperativeDays(line.properties.CODI_TIPUS_CALENDARI)[1],
            'origin': line.properties.ORIGEN_LINIA,
            'destination': line.properties.DESTI_LINIA
        }))
    }

    // Create Line Option Element 
    function createLineOptionElement(line) {        
        let option = document.createElement('option')
        option.innerHTML = `${line.lineName} · ${line.origin} / ${line.destination}`
        option.dataset.lineCode = line.lineCode
        option.dataset.calendarCode = line.calendarCode
        option.dataset.operativeDays = line.operativeDays
        option.dataset.operativeDaysText = line.operativeDaysText
        option.dataset.origin = line.origin
        option.dataset.destination = line.destination
        return option
    }

    // Render Line Information
    function lineInfo() {
        return  `
        <div class="lineInfoBox-content">
            <div class="lineInfoTitle">${txt.busLineInfo}</div>
            <div class="lineInfo" data-operative="${isOperative(linesSelectHMTL.selectedOptions[0].dataset.operativeDays).operative}">
                <div class="lineInfo-field lineInfo-field-operation">${linesSelectHMTL.selectedOptions[0].dataset.operativeDaysText}</div>
                <div class="lineInfo-field lineInfo-field-origin"><strong>${txt.origin}: </strong>${linesSelectHMTL.selectedOptions[0].dataset.origin}</div>
                <div class="lineInfo-field lineInfo-field-destination"><strong>${txt.destination}: </strong>${linesSelectHMTL.selectedOptions[0].dataset.destination}</div>
                <div class="lineInfo-field lineInfo-field-message">${isOperative(linesSelectHMTL.selectedOptions[0].dataset.operativeDays).message}</div>
            </div>
        </div>
        `        
    }

    // BUS STOPS FUNCTIONS

    // Bus Stops Array Builder
    function buildStopsArray(data) {
        return data.features.map(stop => ({
            'stopName': stop.properties.NOM_PARADA,
            'lineCode': stop.properties.CODI_LINIA.toString(),
            'stopCode': stop.properties.CODI_PARADA.toString(),
            'lineDirection': stop.properties.DESTI_SENTIT
        }))
    }

    // Create Stop Option Element 
    function createStopOptionElement(stop) {        
        let option = document.createElement('option')
        option.innerHTML = `${stop.stopCode} · ${stop.stopName}, ${txt.direction}: ${stop.lineDirection}`
        option.dataset.lineCode = stop.lineCode
        option.dataset.stopCode = stop.stopCode
        option.dataset.lineDirection = stop.lineDirection
        return option
    }

    /* GET OPERATIVE DAYS
    - The API serves the information about the operative days in two ways: text (in catalan) and with a number code
    - This function takes the known number codes (1,2,3,6,7) and returns an array with the relation of days of operativity and a message, in english
    - This information is included in the Lines <option> dataset to, once selected, check if the line is (most probably) operative the current day
    */
    function getOperativeDays(tipusCalendari) {
        let operativeDays = []
        let operativeDaysText
        /*
        CODI_TIPUS_CALENDARI code number / Operative days correlation (using 7 for holiday and 8 for NOT on holiday):
        1: Every day [0,1,2,3,4,5,6,7]
        2: Working days [1,2,3,4,5,8]
        3: Working days and saturdays [1,2,3,4,5,6,8]
        6: Saturdays, sundays and holidays [6,0,7]
        7: Sundays and holidays [0,7]
        */
        switch (tipusCalendari) {
            case '1':
                operativeDays = [0,1,2,3,4,5,6,7]
                operativeDaysText = txt.operatesEveryDay
                break;
            case '2':
                operativeDays = [1,2,3,4,5,8]
                operativeDaysText = txt.operatesWorkDays
                break;
            case '3':
                operativeDays = [1,2,3,4,5,6,8]
                operativeDaysText = txt.operatesWorkSat
                break;
            case '6':
                operativeDays = [6,0,7]
                operativeDaysText = txt.operatesSatSunHol
                break;
            case '7':
                operativeDays = [0,7]
                operativeDaysText = txt.operatesSunHol
                break;
            default:
                operativeDays = []
                operativeDaysText = txt.operatesNoData
        }
        return [operativeDays,operativeDaysText]
    }

    /* IS THE LINE OPERATIVE TODAY?
    - isOperative() takes the array of operative days from a Line's <option> dataset as an argument and checks if the line is operative the current day
    - It takes into account also if the current day is a holiday
    - Returns an object with an informative message and a boolean
    */
    function isOperative(operativeDays) {
        let operativeInfo = {}
        // Is today a holiday?
        const isHoliday = () => getHolidays().includes(currentDay()) ? true : false
        if (operativeDays.includes(currentWeekDay())) {        // Line operates on this weekday
            if(operativeDays.includes(8) && isHoliday()) {     // BUT Line does not operate on Holidays AND today is holiday
                operativeInfo = {
                    'message' : txt.messageNotOnHoliday,
                    'operative' : false
                }
            } else {
                operativeInfo =  {
                    'message': txt.messageOperatesToday,
                    'operative' : true
                }
            }
        } else {                                               // Line does no operate this weekday
            if(operativeDays.includes(7) && isHoliday()) {     // BUT Line operates on holidays AND today is holiday
                operativeInfo = {
                    'message': txt.messageYesOnHolliday,
                    'operative' : true
                }
            } else {
                operativeInfo = {
                    'message': txt.messageNotOperatesToday,
                    'operative' : false
                }
            }
        }
        return operativeInfo
    }

    // Get current week day, 0 for sunday and so on
    function currentWeekDay() {
        let currentDate = new Date()
        return currentDate.getDay()
    }

    // Get current day in date format
    function currentDay() {
        let currentDate = new Date()
        return currentDate.toISOString().substring(0,10)
    }

    // Get holidays (with API, max 100 petitions per day, holidays for whole Catalunya)
    /*
    function getHolidays() {
        let holidays = []
        let currentYear = new Date().getFullYear() 
        fetch(`https://api.generadordni.es/v2/holidays/holidays?country=ES&state=CT&year=${currentYear}`)
        .then(res => res.json())
        .then(data => {
            data.forEach(date => {
                holidays.push(date.date.substring(0,10))
            })
        })
        return holidays
    }
    */
    
    // Get holidays, hard-coded from https://ajuntament.barcelona.cat/calendarifestius/es/, only Barcelona Holidays
    function getHolidays() {
        return [
            "2023-01-06",
            "2023-04-07",
            "2023-04-10",
            "2023-05-01",
            "2023-06-05",
            "2023-06-24",
            "2023-08-15",
            "2023-09-11",
            "2023-09-25",
            "2023-10-12",
            "2023-11-01",
            "2023-12-06",
            "2023-12-08",
            "2023-12-25",
            "2023-12-26",            
        ]
    }

    // Convert from seconds to minutes and seconds
    function secToMinSec(seconds) {
        const min = Math.floor(seconds / 60);
        const unfSec = seconds % 60;
        function formatSec(seconds) { // Adds a '0' before second number if it's only one digit
            if (seconds.toString().length === 1) {
                return `0${seconds}`
            } else {
                return seconds
            }
        }
        const sec = formatSec(unfSec)
        return { 'min':min, 'sec':sec };
    }


    // ANIMATION FUNCTIONS

    // Hide welcome
    function hideWelcomeMessage() {
        welcomeMessage.classList.add('hidden')
    }

    // Expand Display
    function expandCountdown() {
        display.classList.add('expanded')
    }

    // Hide display
    function hideCountdown() {
        display.classList.remove('expanded')
    }

    // Show Line Info
    function expandLineInfoBox() {
        lineInfoBox.innerHTML = lineInfo()
        lineInfoBox.classList.add('expanded')
    }
    
    /* Update Bus aimation position
    - This function (setBusPosition()) is fired every second inside the renderTime()
    - It updates the 'right' position of the Bus SVG in reference to the value of the remainingSeconds variable, if its < 300 seconds
    - If remainingSeconds is 300 the Bus starts to show up at the left of the screen
    - When remainingSeconds reach 0, the Bus 'right' position is 0, thus placing it at the Bus Stop SVG
    */
    const bus = document.querySelector('.svgBus')
    const animationContainer = document.querySelector('.animationDisplay > .container')

    function setBusPosition(remainingSeconds) {
        if(remainingSeconds < 300) {
            let rightPosition = ((getMaxLeftMargin() * remainingSeconds) / 300 )
            bus.style.display = 'initial'
            bus.style.right = rightPosition
        } else {
            bus.style.display = 'none'
        }
    }    

    // Get distance from the right of the animation container to the left of the screen
    function getMaxLeftMargin() {  

        // Gets window width and the animation container width, updated on resize 
        let containerWidth
        let windowWidth
        function getWidthData() {
            containerWidth = window.innerWidth;
            windowWidth = animationContainer.offsetWidth
        }
        getWidthData()
        window.addEventListener('resize', getWidthData);

        return (windowWidth / 2) + (containerWidth / 2)
    }

    // ERROR HANDLING    
    const errorBox = document.querySelector('.errorBox')
    const errorInfo =  document.querySelector('.errorBox-info')

    function showError(message,error) {
        errorInfo.innerHTML = `
            <div class="errorMessage">${message}</div>
            <div class="errorCode">${error}</div>
        `
        errorBox.classList.add('visible')
    }
})

