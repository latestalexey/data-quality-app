import React from 'react';

// Material UI
import { Card, CardText } from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import { FontIcon, IconButton } from 'material-ui';

import classNames from 'classnames';

import Page from '../Page';
import AvailableDatasetsSelect from '../../components/available-datasets-select/AvailableDatasetsSelect';
import AvailableOrganisationUnitsTree from
    '../../components/available-organisation-units-tree/AvailableOrganisationUnitsTree';
import PageHelper from '../../components/page-helper/PageHelper';
import OutlierAnalyisTable from '../../components/outlier-analysis-table/OutlierAnalysisTable';
import AlertBar from '../../components/alert-bar/AlertBar';

// i18n
import { i18nKeys } from '../../i18n';

// helpers
import { convertDateToApiDateFormat } from '../../helpers/dates';
import { getDocsKeyForSection } from '../sections.conf';
import { apiConf } from '../../server.conf';

// styles
import cssPageStyles from '../Page.css';
import jsPageStyles from '../PageStyles';

class MinMaxOutlierAnalysis extends Page {
    static STATE_PROPERTIES = [
        'showTable',
        'startDate',
        'endDate',
        'organisationUnitId',
        'dataSetIds',
        'elements',
        'loading',
    ]

    constructor() {
        super();

        this.state = {
            showTable: false,
            startDate: new Date(),
            endDate: new Date(),
            organisationUnitId: null,
            dataSetIds: [],
            elements: [],
            loading: false,
        };

        this.start = this.start.bind(this);
        this.back = this.back.bind(this);

        this.startDateOnChange = this.startDateOnChange.bind(this);
        this.endDateOnChange = this.endDateOnChange.bind(this);
        this.organisationUnitOnChange = this.organisationUnitOnChange.bind(this);
        this.dataSetsOnChange = this.dataSetsOnChange.bind(this);
        this.toggleCheckbox = this.toggleCheckbox.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const nextState = {};

        Object.keys(nextProps).forEach((property) => {
            if (nextProps.hasOwnProperty(property) && MinMaxOutlierAnalysis.STATE_PROPERTIES.includes(property)) {
                nextState[property] = nextProps[property];
            }
        });

        if (nextState !== {}) {
            this.setState(nextState);
        }
    }

    start() {
        const translator = this.context.translator;
        const api = this.context.d2.Api.getApi();
        if (this.isFormValid()) {
            this.context.updateAppState({
                showSnackbar: true,
                snackbarConf: {
                    // type: LOADING,
                    message: translator(i18nKeys.messages.performingAnalysis),
                },
                pageState: {
                    loading: true,
                },
            });

            api.post(apiConf.endpoints.minMaxOutliersAnalysis, {
                fromDate: convertDateToApiDateFormat(this.state.startDate),
                toDate: convertDateToApiDateFormat(this.state.endDate),
                organisationUnitId: this.state.organisationUnitId,
                dataSetIds: this.state.dataSetIds,
            }).then((response) => {
                if (this.isPageMounted()) {
                    const elements = response.map(OutlierAnalyisTable.convertElementFromApiResponse);

                    this.context.updateAppState({
                        showSnackbar: true,
                        snackbarConf: {
                        // type: SUCCESS,
                            message: translator(i18nKeys.performingAnalysis),
                        },
                        pageState: {
                            elements,
                            loading: false,
                            showTable: true,
                        },
                    });
                }
            }).catch(this.manageError.bind(this));    // FIXME why do I need bind
        }
    }

    back() {
        this.setState({ showTable: false });
    }

    startDateOnChange(event, date) {
        this.setState({ startDate: new Date(date) });
    }

    endDateOnChange(event, date) {
        this.setState({ endDate: new Date(date) });
    }

    organisationUnitOnChange(organisationUnitId) {
        this.setState({ organisationUnitId });
    }

    dataSetsOnChange(event) {
        const dataSetIds = [];
        const selectedOptions = event.target.selectedOptions;
        for (let i = 0; i < selectedOptions.length; i++) {
            dataSetIds.push(selectedOptions[i].value);
        }
        this.setState({ dataSetIds });
    }

    toggleCheckbox(element) {
        const translator = this.context.translator;
        const api = this.context.d2.Api.getApi();
        const elements = this.state.elements;
        for (let i = 0; i < elements.length; i++) {
            const currentElement = elements[i];
            if (currentElement.key === element.key) {
                this.context.updateAppState({
                    showSnackbar: true,
                    snackbarConf: {
                    // type: LOADING,
                        message: translator(i18nKeys.messages.performingRequest),
                    },
                    pageState: {
                        loading: true,
                    },
                });
                api.post(apiConf.endpoints.markDataValue, {
                    followups: [OutlierAnalyisTable.convertElementToToggleFollowupRequest(currentElement)],
                }).then(() => {
                    if (this.isPageMounted()) {
                        currentElement.marked = !currentElement.marked;
                        elements[i] = currentElement;

                        this.context.updateAppState({
                            showSnackbar: true,
                            snackbarConf: {
                            // type: SUCCESS,
                                message: translator(
                                    currentElement.marked ? i18nKeys.messages.marked : i18nKeys.messages.unmarked),
                            },
                            pageState: {
                                elements,
                                loading: false,
                            },
                        });
                    }
                }).catch(this.manageError.bind(this));    // FIXME why do I need bind
                break;
            }
        }
    }

    isFormValid() {
        return this.state.startDate &&
            this.state.endDate &&
            this.state.organisationUnitId &&
            this.state.dataSetIds &&
            this.state.dataSetIds.length > 0;
    }

    isActionDisabled() {
        return !this.isFormValid() || this.state.loading;
    }

    showAlertBar() {
        return this.state.showTable &&
        this.state.elements &&
        this.state.elements.length >= apiConf.results.analysis.limit;
    }

    render() {
        const translator = this.context.translator;
        return (
            <div>
                <h1 className={cssPageStyles.pageHeader}>
                    <IconButton
                        onClick={this.back}
                        style={{ display: this.state.showTable ? 'inline' : 'none' }}
                    >
                        <FontIcon className={'material-icons'}>
                            arrow_back
                        </FontIcon>
                    </IconButton>
                    {translator(i18nKeys.minMaxOutlierAnalysis.header)}
                    <PageHelper
                        sectionDocsKey={getDocsKeyForSection(this.props.sectionKey)}
                    />
                </h1>
                <AlertBar show={this.showAlertBar()} />
                <Card>
                    <CardText>
                        {/* FORM: hidden using style to avoid not needed api requests when going back from table */}
                        <div style={{ display: !this.state.showTable ? 'block' : 'none' }}>
                            <div className="row">
                                <div className={classNames('col-md-4', cssPageStyles.section)}>
                                    <span>
                                        {translator(i18nKeys.minMaxOutlierAnalysis.form.dataSet)}
                                    </span>
                                    <AvailableDatasetsSelect onChange={this.dataSetsOnChange} />
                                </div>
                                <div className={classNames('col-md-4', cssPageStyles.section)}>
                                    <span>
                                        {translator(i18nKeys.minMaxOutlierAnalysis.form.organisationUnit)}
                                    </span>
                                    <AvailableOrganisationUnitsTree onChange={this.organisationUnitOnChange} />
                                </div>
                                <div className={classNames('col-md-4', cssPageStyles.section)}>
                                    <DatePicker
                                        textFieldStyle={jsPageStyles.inputForm}
                                        floatingLabelText={
                                            translator(i18nKeys.minMaxOutlierAnalysis.form.startDate)
                                        }
                                        onChange={this.startDateOnChange}
                                        defaultDate={new Date()}
                                        maxDate={new Date()}
                                        value={this.state.startDate}
                                    />
                                    <DatePicker
                                        textFieldStyle={jsPageStyles.inputForm}
                                        floatingLabelText={
                                            translator(i18nKeys.minMaxOutlierAnalysis.form.endDate)
                                        }
                                        onChange={this.endDateOnChange}
                                        defaultDate={new Date()}
                                        maxDate={new Date()}
                                        value={this.state.endDate}
                                    />
                                </div>
                            </div>
                            <RaisedButton
                                className={cssPageStyles.mainButton}
                                primary
                                label={translator(i18nKeys.minMaxOutlierAnalysis.actionButton)}
                                onClick={this.start}
                                disabled={this.isActionDisabled()}
                            />
                        </div>
                        {/* TABLE */}
                        <div style={{ display: this.state.showTable ? 'block' : 'none' }}>
                            <OutlierAnalyisTable
                                elements={this.state.elements}
                                toggleCheckbox={this.toggleCheckbox}
                            />
                        </div>
                    </CardText>
                </Card>
            </div>
        );
    }
}

export default MinMaxOutlierAnalysis;
