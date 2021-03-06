import $ from 'jquery';
import { escape } from 'lodash';
import { __, sprintf } from './locale';
import axios from './lib/utils/axios_utils';
import { deprecatedCreateFlash as flash } from './flash';
import { parseBoolean, spriteIcon } from './lib/utils/common_utils';

class ImporterStatus {
  constructor({ jobsUrl, importUrl, ciCdOnly }) {
    this.jobsUrl = jobsUrl;
    this.importUrl = importUrl;
    this.ciCdOnly = ciCdOnly;
    this.initStatusPage();
    this.setAutoUpdate();
  }

  initStatusPage() {
    $('.js-add-to-import')
      .off('click')
      .on('click', this.addToImport.bind(this));

    $('.js-import-all')
      .off('click')
      .on('click', function onClickImportAll() {
        const $btn = $(this);
        $btn.disable().addClass('is-loading');
        return $('.js-add-to-import').each(function triggerAddImport() {
          return $(this).trigger('click');
        });
      });
  }

  addToImport(event) {
    const $btn = $(event.currentTarget);
    const $tr = $btn.closest('tr');
    const $targetField = $tr.find('.import-target');
    const $namespaceInput = $targetField.find('.js-select-namespace option:selected');
    const repoData = $tr.data();
    const id = repoData.id || $tr.attr('id').replace('repo_', '');

    let targetNamespace;
    let newName;
    if ($namespaceInput.length > 0) {
      targetNamespace = $namespaceInput[0].innerHTML;
      newName = $targetField.find('#path').prop('value');
      $targetField.empty().append(`${targetNamespace}/${newName}`);
    }
    $btn.disable().addClass('is-loading');

    this.id = id;

    let attributes = {
      repo_id: id,
      target_namespace: targetNamespace,
      new_name: newName,
      ci_cd_only: this.ciCdOnly,
    };

    if (repoData) {
      attributes = Object.assign(repoData, attributes);
    }

    return axios
      .post(this.importUrl, attributes)
      .then(({ data }) => {
        const job = $tr;
        job.attr('id', `project_${data.id}`);

        job.find('.import-target').html(`<a href="${data.full_path}">${data.full_path}</a>`);
        $('table.import-jobs tbody').prepend(job);

        job.addClass('table-active');
        const connectingVerb = this.ciCdOnly ? __('connecting') : __('importing');
        job.find('.import-actions').html(
          sprintf(
            escape(__('%{loadingIcon} Started')),
            {
              loadingIcon: `<i class="fa fa-spinner fa-spin" aria-label="${escape(
                connectingVerb,
              )}"></i>`,
            },
            false,
          ),
        );
      })
      .catch(error => {
        let details = error;

        const $statusField = $tr.find('.job-status');
        $statusField.text(__('Failed'));

        if (error.response && error.response.data && error.response.data.errors) {
          details = error.response.data.errors;
        }

        flash(sprintf(__('An error occurred while importing project: %{details}'), { details }));
      });
  }

  autoUpdate() {
    return axios.get(this.jobsUrl).then(({ data = [] }) => {
      data.forEach(job => {
        const jobItem = $(`#project_${job.id}`);
        const statusField = jobItem.find('.job-status');

        const spinner = '<i class="fa fa-spinner fa-spin"></i>';

        switch (job.import_status) {
          case 'finished':
            jobItem.removeClass('table-active').addClass('table-success');
            statusField.html(`<span>${spriteIcon('check', 's16')} ${__('Done')}</span>`);
            break;
          case 'scheduled':
            statusField.html(`${spinner} ${__('Scheduled')}`);
            break;
          case 'started':
            statusField.html(`${spinner} ${__('Started')}`);
            break;
          case 'failed':
            statusField.html(__('Failed'));
            break;
          default:
            statusField.html(job.import_status);
            break;
        }
      });
    });
  }

  setAutoUpdate() {
    setInterval(this.autoUpdate.bind(this), 4000);
  }
}

// eslint-disable-next-line consistent-return
function initImporterStatus() {
  const importerStatus = document.querySelector('.js-importer-status');

  if (importerStatus) {
    const data = importerStatus.dataset;
    return new ImporterStatus({
      jobsUrl: data.jobsImportPath,
      importUrl: data.importPath,
      ciCdOnly: parseBoolean(data.ciCdOnly),
    });
  }
}

export { initImporterStatus as default, ImporterStatus };
