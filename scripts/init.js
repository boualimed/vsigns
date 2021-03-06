

    /*=================================================================
     =            Variable definitions and initializations            =
     =================================================================*/

    var chart = null;

    //data is reused if url is not changed
    var currentData;
    var currentUrl = "/1yr.json";

    var loadingMessage = d3.select( '.loading-message' );
    var datapointDetails = d3.select( '.datapoint-details' );
    var clickInteraction = null;
    var clickInteractionComponent = null;

    //an example of some settings for custom chart appearance
    var settings = {
        'interface': {
            'axes': {
                'yAxis': {
                    'visible': true
                },
                'xAxis': {
                    'visible': true
                }
            },
            'tooltips': {
                'decimalPlaces': 4
            }
        },
        'measures': {
            'distance': {
                'seriesName': 'Distance',
                'yAxis':{
                    'range': { 'min': 0, 'max': 200000 },
                    'label': 'm'
                },
                'data': {
                    'yValuePath': 'body.distance.value',
                    'xValueQuantization': {
                        'period': OMHWebVisualizations.DataParser.QUANTIZE_MONTH,
                        'aggregator': OMHWebVisualizations.DataParser.aggregators.sum
                    }
                },
                'chart': {
                    'type': 'clustered_bar',
                    'daysShownOnTimeline': { 'min': 90, 'max': 365 },
                    'styles': [
                        {
                            'name': 'default',
                            'plotType': 'ClusteredBar',
                            'attributes': { 'fill': '#e8ac4e' },
                            'filters': [ function ( d ) {
                                return d.x.getMonth() == 5;
                            } ]
                        }
                    ]
                }
            },
            'heart_rate': {
                'chart': {
                    'styles': [
                        {
                            'name': 'blue-lines',
                            'plotType': 'Line',
                            'attributes': {
                                'stroke': '#4a90e2'
                            }
                        }
                    ]
                }
            },
            'body_weight': {
                'data': {
                    'xValueQuantization': {
                        'period': OMHWebVisualizations.DataParser.QUANTIZE_MONTH,
                        'aggregator': OMHWebVisualizations.DataParser.aggregators.median
                    }
                }
            },
            'systolic_blood_pressure': {
                'seriesName': 'Blood Pressure',
                'yAxis': {
                    'range': { 'min': 60, 'max': 140 }
                },
                'chart': {
                    'daysShownOnTimeline': { 'min': 0, 'max': Infinity },
                    'styles': [
                        { // make the points above the gridline orange
                            'name': 'above',
                            'plotType': 'Scatter',
                            'filters': [ OMHWebVisualizations.ChartStyles.filters.above( 120 ) ],
                            'attributes': {
                                'fill': '#e8ac4e',
                                'stroke': '#745628'
                            }
                        }
                    ],
                    'gridlines': [
                        { value: 120, label: '120', visible: true }
                    ]
                }
            },
            'diastolic_blood_pressure': {
                'seriesName': 'Blood Pressure',
                'chart': {
                    'styles': [ // make the points above the gridline orange
                        {
                            'name': 'above',
                            'plotType': 'Scatter',
                            'filters': [ OMHWebVisualizations.ChartStyles.filters.above( 80 ) ],
                            'attributes': {
                                'fill': '#e8ac4e',
                                'stroke': '#745628'
                            }
                        }
                    ],
                    'gridlines': [
                        { value: 80, label: '80', visible: true }
                    ]
                }
            }
        }
    };

    /*=====  End of Variable definitions and initializations  ======*/


    /*===================================================
     =            Example UI helper functions            =
     ===================================================*/

    var hideLoadingMessage = function () {
        loadingMessage.classed( 'hidden', true );
    };

    var updateLoadingMessage = function ( amountLoaded ) {
        loadingMessage.classed( 'hidden', false );
        loadingMessage.text( 'Loading data... ' + Math.round( amountLoaded * 100 ) + '%' );
    };

    var showLoadingError = function ( error ) {
        loadingMessage.classed( 'hidden', false );
        loadingMessage.html( 'There was an error while trying to load the data: <pre>' + JSON.stringify( error ) + '</pre>' );
    };

    var hideChart = function () {
        d3.select( '.demo-chart' ).classed( 'hidden', true );
    };

    var showChart = function () {
        d3.select( '.demo-chart' ).classed( 'hidden', false );
    };

    var disableUI = function () {
        d3.select( '.measure-select' ).property( 'disabled', true );
        d3.select( '.update-button' ).property( 'disabled', true );
    };
    var enableUI = function () {
        d3.select( '.measure-select' ).property( 'disabled', false );
        d3.select( '.update-button' ).property( 'disabled', false );
    };

    var updateDatapointDetails = function ( datum ) {

        // use the replacer to hide fields from the output
        var replacer = function ( key, value ) {
            if ( key === 'groupName' ) {
                return undefined;
            } else {
                return value;
            }
        };

        if ( datum.aggregationType ) {
            // if the point is a aggregation of more than one point
            // then display the aggregation type and the points that were used
            var dataString = '';
            for ( var i in datum.aggregatedData ) {
                dataString += JSON.stringify( datum.aggregatedData[ i ], replacer, 4 ) + '\n\n';
                if ( i < datum.aggregatedData.length - 1 ) {
                    dataString += '<hr>\n';
                }
            }
            datapointDetails.html( '<h3>Data Point Details: ' + datum.aggregationType + ' of points</h3> ' + dataString );
        } else {
            // otherwise just show the point
            datapointDetails.html( '<h3>Data Point Details: single point</h3> ' + JSON.stringify( datum.omhDatum, replacer, 4 ) );
        }

    };

    var showDatapointDetailsMessage = function ( message ) {
        datapointDetails.html( '<h3>Data Point Details</h3> ' + message );
    };


    /*=====  End of Example UI helper functions  ======*/


    /*====================================================
     =            Chart construction functions            =
     ====================================================*/

    var customizeChartComponents = function ( components ) {

        //move any label overlayed on the bottom right
        //of the chart up to the top left
        var plots = components.plots;

        showDatapointDetailsMessage( 'Choose a measure that displays as a scatter plot to see details here.' );

        plots.forEach( function ( component ) {

            if ( component instanceof Plottable.Components.Label &&
                    component.yAlignment() === 'bottom' &&
                    component.xAlignment() === 'right' ) {

                component.yAlignment( 'top' );
                component.xAlignment( 'left' );

            }
            if ( component instanceof Plottable.Plots.Scatter && component.datasets().length > 0 ) {

                scatterPlot = component;

                if ( !clickInteraction ) {
                    clickInteraction = new Plottable.Interactions.Click()
                            .onClick( function ( point ) {
                                var nearestEntity;
                                try {
                                    nearestEntity = scatterPlot.entityNearest( point );
                                    updateDatapointDetails( nearestEntity.datum );
                                } catch ( e ) {
                                    return;
                                }
                            } );
                }

                clickInteraction.attachTo( scatterPlot );
                clickInteractionComponent = scatterPlot;

                showDatapointDetailsMessage( 'Click on a point to see details here...' );

            }

        } );

        if ( chart.getMeasures().indexOf( 'systolic_blood_pressure' ) > -1 ) {
            addDangerZone();
        }

    };

    var addDangerZone = function () {

        // get the existing styles from the chart so we can alter them
        var chartStyles = chart.getStyles();
        var scatterPlot = chart.getPlots( Plottable.Plots.Scatter )[ 0 ];

        // the value where a grid line is drawn,
        // above which points are colored red
        var dangerValue = 129;

        // these filter functions are used to determine which
        // points will be rendered with the style's attributes
        var dangerFilter = function ( d ) {
            // a filter function takes a datum and returns a boolean
            return d.y >= dangerValue;
        };

        // ChartStyles.filters contains a number of useful filters
        var systolicFilter = OMHWebVisualizations.ChartStyles.filters.measure( 'systolic_blood_pressure' );

        // initialize new styles with the existing ones
        var plotStylesWithDanger = chartStyles.getStylesForPlot( scatterPlot );

        // add a 'danger zone' for systolic, using the filters defined above
        plotStylesWithDanger.push(
                {
                    'name': 'danger',
                    'filters': [ dangerFilter, systolicFilter ],
                    'attributes': {
                        'fill': 'red'
                    }
                }
        );

        // replace styles for the plot with the extended danger-zone styles
        chartStyles.setStylesForPlot( plotStylesWithDanger, scatterPlot );

        // add a gridline for the danger zone
        chart.addGridline( dangerValue, 'Above ' + dangerValue + ' exceeds patient goal' );

    };

    var makeChartForUrl = function ( url, element, measureList, configSettings ) {

        var makeChart = function ( data ) {

            //if data is from shimmer, the points are in an array called 'body'
            if ( data.hasOwnProperty( 'body' ) ) {
                data = data.body;
            }

            if ( chart ) {
                chart.destroy();
                if ( clickInteraction && clickInteractionComponent ) {
                    clickInteraction.detachFrom( clickInteractionComponent );
                }
            }

            //builds a new plottable chart
            chart = new OMHWebVisualizations.Chart( data, element, measureList, configSettings );

            if ( chart.initialized ) {

                //customizes the chart's components
                customizeChartComponents( chart.getComponents() );

                //renders the chart to an svg element
                showChart();
                hideLoadingMessage();
                chart.renderTo( element.select( "svg" ).node() );

                currentData = data;
                currentUrl = url;


            } else {

                hideChart();
                showLoadingError( 'Chart could not be initialized with the arguments supplied.' );

            }

            enableUI();

        };

        disableUI();

        if ( url === currentUrl && currentData !== null ) {

            makeChart( currentData );

        } else {

            hideChart();

            var xhr = d3.json( url )
                    .on( "progress", function () {
                        updateLoadingMessage( d3.event.loaded / d3.event.total );
                    } )
                    .on( "load", function ( json ) {
                        makeChart( json );
                    } )
                    .on( "error", function ( error ) {
                        hideChart();
                        showLoadingError( error );
                    } )
                    .get();

        }


    };

    var cloneObject = function ( object ) {
        return JSON.parse( JSON.stringify( object ) );
    };

    var parseInputAndMakeChart = function () {

        // Collect the user's input
        var url = d3.select( 'input.update-url' ).node().value;
        var measureList = d3.select( 'select' ).node().value;

        // Use settings specified at top of script, but overwrite
        // the step_count settings if it has been chosen in the menu.

        // This allows us to change the appearance of step_count data,
        // which normally defaults to a bar graph when shown with
        // minutes_of_moderate_activity, to a line graph when
        // shown on its own.

        var chartSettings = settings;

        if ( measureList === 'step_count' ) {

            chartSettings = cloneObject( settings );

            chartSettings[ 'measures' ][ 'step_count' ] = {
                'yAxis':{
                    'range': undefined
                },
                'data': {
                    'xValueQuantization': {
                        'period': OMHWebVisualizations.DataParser.QUANTIZE_MONTH
                    }
                },
                'chart': {
                    'type': 'line',
                    'daysShownOnTimeline': undefined
                }
            };

        } else if ( measureList === 'minutes_moderate_activity, step_count' ) {

            chartSettings = cloneObject( settings );

            chartSettings.interface.legend = { visible: true };


        } else if ( measureList === 'heart_rate' ) {

            chartSettings = cloneObject( settings );

            chartSettings.interface.tooltips.visible = false;

        }

        // Make the chart
        makeChartForUrl( url, d3.select( '.demo-chart-container' ), measureList, chartSettings );

    };

    /*=====  End of Chart construction functions  ======*/


    //set up the UI elements
    d3.select( 'select' ).on( 'change', parseInputAndMakeChart );
    d3.select( '.update-button' ).on( 'click', parseInputAndMakeChart );

    //make the chart when the document is loaded
    parseInputAndMakeChart();

