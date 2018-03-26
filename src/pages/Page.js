import { Component } from 'react';
import PropTypes from 'prop-types';

// i18n
import { i18nKeys } from '../i18n';

class Page extends Component {
  static propTypes = {
      sectionKey: PropTypes.string.isRequired,
  }

  static contextTypes = {
      d2: PropTypes.object,
      currentSection: PropTypes.string,
      updateAppState: PropTypes.func,
      translator: PropTypes.func,
  }

  componentWillMount() {
      this.pageMounted = true;

      // update section on side bar
      if (this.context.currentSection !== this.props.sectionKey) {
          this.context.updateAppState({
              currentSection: this.props.sectionKey,
          });
      }
  }

  componentWillUnmount() {
      this.pageMounted = false;
  }

  isPageMounted() {
      return this.pageMounted;
  }

  manageError(error) {
      if (this.isPageMounted()) {
          const messageError = error && error.message ?
              error.message :
              this.context.translator(i18nKeys.messages.unexpectedAnalysisError);

          this.context.updateAppState({
              showSnackbar: true,
              snackbarConf: {
                  // type: ERROR,
                  message: messageError,
              },
              pageState: {
                  loading: false,
              },
          });
      }
  }
}

export default Page;

