import findPackageJson from 'find-package-json';
import createLogger from 'debug';
import nockManager from './manager.js';
import {
  configure,
  initFixtures,
  loadFixture,
  saveFixture,
  applyFiltersToScope,
} from './fixtures.js';
import {permissions} from './modes.js';

export {configure};

const debug = createLogger('ava-nock:index');

configure(findPackageJson().next().value['ava-nock']);

async function beforeEach(t) {
  const context = {
    title: t.title.replace(/^(beforeEach for|beforeEach hook for) /, ''),
  };
  t.context.nock = context;
  debug(`Starting beforeEach hook: ${context.title}`);
  const release = await nockManager.acquire();
  debug(`Lock acquired: ${context.title}`);
  context.release = release;
  const fixture = await loadFixture(t);
  if (fixture || !permissions.network) {
    nockManager.disableNetwork();
  } else if (permissions.write) {
    nockManager.startRecording({requestHeaders: true});
  }
  context.inputCalls = fixture;
  if (fixture && fixture.length) {
    context.scopes = nockManager.loadCalls(fixture).map(applyFiltersToScope);
  } else {
    context.scopes = [];
  }
}

async function afterEach(t) {
  const context = t.context.nock;
  debug(`Starting afterEach hook: ${context.title}`);
  if (nockManager.isRecording()) {
    context.recordedCalls = nockManager.getRecordedCalls();
  }
  nockManager.disable();
  if (context.inputCalls) {
    debug('Checking that expected requests were made.');
    context.scopes.forEach((scope) => {
      if (!scope.isDone()) {
        t.fail(
          `The following requests from the test fixture were not made:\n\n  ${scope
            .pendingMocks()
            .join(
              '\n  '
            )}\n\nVerify that your test and code are correct. If they are, consider re-recording the test.`
        );
      }
    });
  }
  await saveFixture(t);
}

function afterEachAlways(t) {
  const context = t.context.nock;
  context.release();
  debug(`Lock released: ${context.title}`);
}

export function setupTests(ava) {
  initFixtures(ava);
  ava.beforeEach(beforeEach);
  ava.afterEach(afterEach);
  ava.afterEach.always(afterEachAlways);
}

