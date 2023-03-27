WHAT?
******
NextBus is a JS Single Page Application that shows the remaining time for a Bus to arrive for a given Bus Line and Stop.


HOW?
******
It works fetching data from the API services of TMB (Barcelona Metropolitan Transport).
First, it fetches the data with the list of the Lines and creates a select tag.
Once the option is selected, the app displays information about the line and fetches the data with the Stops of the selected line.
When the user selects the Bus Stop, the app retrieves the remaining time (in seconds) for the Line and Stop.
The remaining time is converted to mm:ss and it's updated every 15 seconds.
Between every update the App does a second-by-second countdown, thus creating an illussion of real-time update.
Also, there is a little animation of a Bus aproaching a Bus Stop that updates every second relatively to the remaining time.

Every Bus Line has it's own operative days (including holidays), so the App checks for the current day of the week and if it is holiday or not.
Then it compares with the operative days of the selected Line and shows a message warning the user if the Line may or may be not operative.
For the Holidays, there are 2 possibilities: Hard-coded dates or fetch the information from an API.
The problem here is that the only one API that serves the Holidays (of Catalonia) that I've found it's limited to 100 queries per day so, even the code is written in the project, right now the App uses Hard-coded dates.


WHY?
******
This is just a project for me to practice HTML, CSS and JS, the fetch API and the Data Analysis, and to show it in my Portfolio.


WHERE?
******
NextBus App:           https://www.xexi.es/apps/nextbus
TMB API:               https://developer.tmb.cat/
Holidays API (CAT):    https://api.generadordni.es
Holidays Info (BCN):   https://ajuntament.barcelona.cat/calendarifestius/es/