87300-snud-frontend/
├── angular.json
├── CODEBASE-ANALYSIS-REPORT.md
├── DOCUMENTATION-ROADMAP.md
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.app.json
├── tsconfig.e2e.json
├── tsconfig.json
├── tsconfig.spec.json
├── web.config
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BEST-PRACTICES.md
│   ├── BUNDLE-OPTIMIZATION.md
│   ├── CHANGELOG.md
│   ├── CLI-SCHEMATICS.md
│   ├── COMPOSABLES-API.md
│   ├── CONTRIBUTING.md
│   ├── DOCUMENTATION-INDEX.md
│   ├── ENVIRONMENT-SETUP.md
│   ├── HOW-TO.md
│   ├── NAMING-CONVENTIONS.md
│   ├── SCHEMATIC-EXEMPLE.md
│   ├── SMART-DUMB-PATTERN.md
│   ├── SPEC-farm-account-group.md
│   ├── TROUBLESHOOTING.md
│   ├── plan/
│   │   └── discussed-strategy-plan.md
│   └── spec/
│       ├── spec-discussed-strategy.md
│       └── spec.md
│
├── e2e/
│   ├── README.md
│   ├── helpers/
│   │   ├── api-mock.helper.ts
│   │   ├── auth.helper.ts
│   │   ├── navigation.helper.ts
│   │   └── fixtures/
│   │       ├── allotment-group.fixture.ts
│   │       ├── allotment.fixture.ts
│   │       ├── area-unit.fixture.ts
│   │       ├── broker.fixture.ts
│   │       ├── commodity.fixture.ts
│   │       ├── cost-group.fixture.ts
│   │       ├── cost-plan.fixture.ts
│   │       ├── cost-unit.fixture.ts
│   │       ├── currency-pair.fixture.ts
│   │       ├── customer-account.fixture.ts
│   │       ├── farm.fixture.ts
│   │       ├── fixing.fixture.ts
│   │       ├── harvest.fixture.ts
│   │       ├── operation-type.fixture.ts
│   │       ├── permission.fixture.ts
│   │       ├── pool.fixture.ts
│   │       ├── promissory-note.fixture.ts
│   │       ├── role.fixture.ts
│   │       ├── team.fixture.ts
│   │       └── user.fixture.ts
│   └── tests/
│       ├── navigation.spec.ts
│       ├── commodity-hub/
│       │   ├── area-unit.spec.ts
│       │   ├── commodity.spec.ts
│       │   ├── cost-group.spec.ts
│       │   ├── cost-plan.spec.ts
│       │   ├── cost-unit.spec.ts
│       │   ├── currency-pair.spec.ts
│       │   ├── farm.spec.ts
│       │   ├── fixing.spec.ts
│       │   ├── harvest.spec.ts
│       │   ├── operation-type.spec.ts
│       │   └── position-control.spec.ts
│       ├── customers/
│       │   ├── promissory-note.spec.ts
│       │   └── parametrization/
│       └── security/
│           ├── auth.spec.ts
│           ├── permission-gates.spec.ts
│           ├── permission.spec.ts
│           ├── role.spec.ts
│           └── user.spec.ts
│
├── schematics/
│   ├── collection.json
│   ├── README.md
│   ├── tsconfig.json
│   └── crud-feature/
│       ├── index.ts
│       ├── schema.json
│       ├── schema.ts
│       └── files/
│
└── src/
    ├── index.html
    ├── main.ts
    ├── material-theme.scss
    ├── styles.css
    └── app/
        ├── app.config.ts
        ├── app.css
        ├── app.html
        ├── app.routes.ts
        ├── app.spec.ts
        ├── app.ts
        │
        ├── environment/
        │   └── environment.ts
        │
        ├── core/
        │   ├── guards/
        │   │   └── auth.guard.ts
        │   ├── interceptors/
        │   │   ├── api-error.interceptor.ts
        │   │   └── auth.interceptor.ts
        │   ├── layout/
        │   │   ├── footer/
        │   │   │   ├── footer.css
        │   │   │   ├── footer.html
        │   │   │   ├── footer.spec.ts
        │   │   │   └── footer.ts
        │   │   ├── main/
        │   │   │   ├── main.css
        │   │   │   ├── main.html
        │   │   │   ├── main.spec.ts
        │   │   │   └── main.ts
        │   │   └── menu/
        │   │       ├── menu.css
        │   │       ├── menu.html
        │   │       ├── menu.spec.ts
        │   │       └── menu.ts
        │   ├── pages/
        │   │   ├── access-denied/
        │   │   │   ├── access-denied.css
        │   │   │   ├── access-denied.html
        │   │   │   └── access-denied.ts
        │   │   ├── home/
        │   │   │   ├── home.css
        │   │   │   ├── home.html
        │   │   │   ├── home.spec.ts
        │   │   │   └── home.ts
        │   │   ├── login/
        │   │   │   ├── login.css
        │   │   │   ├── login.html
        │   │   │   ├── login.ts
        │   │   │   └── constants/
        │   │   │       └── login.constants.ts
        │   │   ├── not-found/
        │   │   │   ├── not-found.css
        │   │   │   ├── not-found.html
        │   │   │   └── not-found.ts
        │   │   └── okta-callback/
        │   │       └── okta-callback.ts
        │   └── features/
        │       ├── commodity-hub/
        │       │   ├── commodity-hub.routes.ts
        │       │   ├── SPEC-fixing-frontend.md
        │       │   ├── area-unit/
        │       │   │   ├── components/area-unit-list-presenter/
        │       │   │   │   ├── area-unit-list-presenter.html
        │       │   │   │   ├── area-unit-list-presenter.spec.ts
        │       │   │   │   └── area-unit-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── area-unit-form.config.ts
        │       │   │   │   ├── area-unit.constants.ts
        │       │   │   │   └── list-area-unit-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── area-unit-response.ts
        │       │   │   │   ├── create-area-unit-request.ts
        │       │   │   │   ├── filter-area-unit-request.ts
        │       │   │   │   └── update-area-unit-request.ts
        │       │   │   └── services/
        │       │   │       ├── area-unit.spec.ts
        │       │   │       └── area-unit.ts
        │       │   ├── commodity/
        │       │   │   ├── components/commodity-list-presenter/
        │       │   │   │   ├── commodity-list-presenter.html
        │       │   │   │   ├── commodity-list-presenter.spec.ts
        │       │   │   │   └── commodity-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── commodity-form.config.ts
        │       │   │   │   ├── commodity.constants.ts
        │       │   │   │   └── list-commodity-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── commodity-response.ts
        │       │   │   │   ├── create-commodity-request.ts
        │       │   │   │   ├── filter-commodity-request.ts
        │       │   │   │   └── update-commodity-request.ts
        │       │   │   └── services/
        │       │   │       ├── commodity.spec.ts
        │       │   │       └── commodity.ts
        │       │   ├── cost-group/
        │       │   │   ├── components/cost-group-list-presenter/
        │       │   │   │   ├── cost-group-list-presenter.html
        │       │   │   │   ├── cost-group-list-presenter.spec.ts
        │       │   │   │   └── cost-group-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── cost-group-form.config.ts
        │       │   │   │   ├── cost-group.constants.ts
        │       │   │   │   └── list-cost-group-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── cost-group-response.ts
        │       │   │   │   ├── create-cost-group-request.ts
        │       │   │   │   ├── filter-cost-group-request.ts
        │       │   │   │   └── update-cost-group-request.ts
        │       │   │   └── services/
        │       │   │       ├── cost-group.spec.ts
        │       │   │       └── cost-group.ts
        │       │   ├── cost-plan/
        │       │   │   ├── components/cost-plan-list-presenter/
        │       │   │   │   ├── cost-plan-list-presenter.html
        │       │   │   │   ├── cost-plan-list-presenter.spec.ts
        │       │   │   │   └── cost-plan-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── cost-plan-form.config.ts
        │       │   │   │   ├── cost-plan.constants.ts
        │       │   │   │   └── list-cost-plan-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── cost-plan-response.ts
        │       │   │   │   ├── create-cost-plan-request.ts
        │       │   │   │   ├── filter-cost-plan-request.ts
        │       │   │   │   └── update-cost-plan-request.ts
        │       │   │   └── services/
        │       │   │       ├── cost-plan.spec.ts
        │       │   │       └── cost-plan.ts
        │       │   ├── cost-unit/
        │       │   │   ├── components/cost-unit-list-presenter/
        │       │   │   │   ├── cost-unit-list-presenter.html
        │       │   │   │   ├── cost-unit-list-presenter.spec.ts
        │       │   │   │   └── cost-unit-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── cost-unit-form.config.ts
        │       │   │   │   ├── cost-unit.constants.ts
        │       │   │   │   └── list-cost-unit-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── cost-unit-response.ts
        │       │   │   │   ├── create-cost-unit-request.ts
        │       │   │   │   ├── filter-cost-unit-request.ts
        │       │   │   │   └── update-cost-unit-request.ts
        │       │   │   └── services/
        │       │   │       ├── cost-unit.spec.ts
        │       │   │       └── cost-unit.ts
        │       │   ├── currency-pair/
        │       │   │   ├── components/currency-pair-list-presenter/
        │       │   │   │   ├── currency-pair-list-presenter.html
        │       │   │   │   ├── currency-pair-list-presenter.spec.ts
        │       │   │   │   └── currency-pair-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── currency-pair-form.config.ts
        │       │   │   │   ├── currency-pair.constants.ts
        │       │   │   │   └── list-currency-pair-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── currency-pair-response.ts
        │       │   │   │   ├── create-currency-pair-request.ts
        │       │   │   │   ├── filter-currency-pair-request.ts
        │       │   │   │   └── update-currency-pair-request.ts
        │       │   │   └── services/
        │       │   │       ├── currency-pair.spec.ts
        │       │   │       └── currency-pair.ts
        │       │   ├── farm/
        │       │   │   ├── components/farm-list-presenter/
        │       │   │   │   ├── farm-list-presenter.html
        │       │   │   │   ├── farm-list-presenter.spec.ts
        │       │   │   │   └── farm-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── farm-form.config.ts
        │       │   │   │   ├── farm.constants.ts
        │       │   │   │   └── list-farm-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── create-farm-request.ts
        │       │   │   │   ├── farm-response.ts
        │       │   │   │   ├── filter-farm-request.ts
        │       │   │   │   └── update-farm-request.ts
        │       │   │   └── services/
        │       │   │       ├── farm.spec.ts
        │       │   │       └── farm.ts
        │       │   ├── fixing/
        │       │   │   ├── components/fixing-list-presenter/
        │       │   │   │   ├── fixing-list-presenter.html
        │       │   │   │   ├── fixing-list-presenter.spec.ts
        │       │   │   │   └── fixing-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── fixing-form.config.ts
        │       │   │   │   ├── fixing.constants.ts
        │       │   │   │   └── list-fixing-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── create-fixing-request.ts
        │       │   │   │   ├── filter-fixing-request.ts
        │       │   │   │   ├── fixing-response.ts
        │       │   │   │   └── update-fixing-request.ts
        │       │   │   └── services/
        │       │   │       ├── fixing.spec.ts
        │       │   │       └── fixing.ts
        │       │   ├── harvest/
        │       │   │   ├── components/harvest-list-presenter/
        │       │   │   │   ├── harvest-list-presenter.html
        │       │   │   │   ├── harvest-list-presenter.spec.ts
        │       │   │   │   └── harvest-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── harvest-form.config.ts
        │       │   │   │   ├── harvest.constants.ts
        │       │   │   │   └── list-harvest-table.config.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── create-harvest-request.ts
        │       │   │   │   ├── filter-harvest-request.ts
        │       │   │   │   ├── harvest-response.ts
        │       │   │   │   └── update-harvest-request.ts
        │       │   │   └── services/
        │       │   │       ├── harvest.spec.ts
        │       │   │       └── harvest.ts
        │       │   ├── office/
        │       │   │   ├── components/office-list-presenter/
        │       │   │   │   ├── office-list-presenter.html
        │       │   │   │   ├── office-list-presenter.spec.ts
        │       │   │   │   └── office-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── list-office-table.config.ts
        │       │   │   │   ├── office-form.config.ts
        │       │   │   │   └── office.constants.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── create-office-request.ts
        │       │   │   │   ├── filter-office-request.ts
        │       │   │   │   ├── office-response.ts
        │       │   │   │   └── update-office-request.ts
        │       │   │   └── services/
        │       │   │       ├── office.spec.ts
        │       │   │       └── office.ts
        │       │   ├── operation-type/
        │       │   │   ├── components/operation-type-list-presenter/
        │       │   │   │   ├── operation-type-list-presenter.html
        │       │   │   │   ├── operation-type-list-presenter.spec.ts
        │       │   │   │   └── operation-type-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── list-operation-type-table.config.ts
        │       │   │   │   ├── operation-type-form.config.ts
        │       │   │   │   └── operation-type.constants.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── create-operation-type-request.ts
        │       │   │   │   ├── filter-operation-type-request.ts
        │       │   │   │   ├── operation-type-response.ts
        │       │   │   │   └── update-operation-type-request.ts
        │       │   │   └── services/
        │       │   │       ├── operation-type.spec.ts
        │       │   │       └── operation-type.ts
        │       │   ├── productivity-unit/
        │       │   │   ├── interfaces/
        │       │   │   │   └── productivity-unit-response.ts
        │       │   │   └── services/
        │       │   │       └── productivity-unit.ts
        │       │   └── position-control/
        │       │       ├── components/
        │       │       │   ├── index.ts
        │       │       │   ├── position-control-form-dialog/
        │       │       │   │   ├── position-control-form-dialog.css
        │       │       │   │   ├── position-control-form-dialog.html
        │       │       │   │   └── position-control-form-dialog.ts
        │       │       │   └── position-control-list-presenter/
        │       │       │       ├── position-control-list-presenter.css
        │       │       │       ├── position-control-list-presenter.html
        │       │       │       ├── position-control-list-presenter.spec.ts
        │       │       │       └── position-control-list-presenter.ts
        │       │       ├── composables/
        │       │       │   └── use-position-control-form-loader.ts
        │       │       ├── constants/
        │       │       │   ├── index.ts
        │       │       │   ├── list-position-control-table.config.ts
        │       │       │   ├── position-control-form.config.ts
        │       │       │   ├── position-control.constants.ts
        │       │       │   └── search-position-control-form.ts
        │       │       ├── interfaces/
        │       │       │   ├── index.ts
        │       │       │   ├── position-control-request.interface.ts
        │       │       │   └── position-control-response.interface.ts
        │       │       ├── pages/
        │       │       │   └── position-control-detail/
        │       │       │       ├── position-control-haverst-cost/
        │       │       │       │   └── position-control-haverst-cost-presenter.ts
        │       │       │       └── position-control-detail-presenter.ts
        │       │       ├── services/
        │       │       │   ├── index.ts
        │       │       │   ├── position-control.spec.ts
        │       │       │   └── position-control.ts
        │       │       └── utils/
        │       │           └── position-control-mapper.util.ts
        │       ├── customers/
        │       │   ├── customers.routes.ts
        │       │   ├── customer/
        │       │   │   ├── components/
        │       │   │   │   ├── customer-form-dialog/
        │       │   │   │   │   ├── customer-form-dialog.css
        │       │   │   │   │   ├── customer-form-dialog.html
        │       │   │   │   │   └── customer-form-dialog.ts
        │       │   │   │   └── customer-list-presenter/
        │       │   │   │       ├── customer-list-presenter.html
        │       │   │   │       └── customer-list-presenter.ts
        │       │   │   ├── constants/
        │       │   │   │   ├── customer-form.config.ts
        │       │   │   │   ├── list-customer-table.config.ts
        │       │   │   │   └── search-customer-form.ts
        │       │   │   ├── interfaces/
        │       │   │   │   ├── create-customer-request.ts
        │       │   │   │   ├── customer-response.ts
        │       │   │   │   ├── filter-customer-request.ts
        │       │   │   │   └── update-customer-request.ts
        │       │   │   └── services/
        │       │   │       └── customer.ts
        │       │   ├── customer-account/
        │       │   │   ├── interfaces/
        │       │   │   │   └── customer-account-response.ts
        │       │   │   └── services/
        │       │   │       ├── customer-account.spec.ts
        │       │   │       └── customer-account.ts
        │       │   ├── parametrization/
        │       │   │   ├── parametrization.routes.ts
        │       │   │   ├── allocation-group/
        │       │   │   │   ├── interfaces/
        │       │   │   │   │   └── allocation-group-response.ts
        │       │   │   │   └── services/
        │       │   │   │       └── allocation-group.ts
        │       │   │   ├── allotment/
        │       │   │   │   ├── components/allotment-list-presenter/
        │       │   │   │   │   ├── allotment-list-presenter.html
        │       │   │   │   │   ├── allotment-list-presenter.spec.ts
        │       │   │   │   │   └── allotment-list-presenter.ts
        │       │   │   │   ├── constants/
        │       │   │   │   │   ├── allotment-form.config.ts
        │       │   │   │   │   ├── allotment.constants.ts
        │       │   │   │   │   ├── list-allotment-table.config.ts
        │       │   │   │   │   └── search-allotment-form.ts
        │       │   │   │   ├── interfaces/
        │       │   │   │   │   ├── allotment-response.ts
        │       │   │   │   │   ├── create-allotment-request.ts
        │       │   │   │   │   ├── filter-allotment-request.ts
        │       │   │   │   │   └── update-allotment-request.ts
        │       │   │   │   └── services/
        │       │   │   │       ├── allotment.spec.ts
        │       │   │   │       └── allotment.ts
        │       │   │   ├── allotment-group/
        │       │   │   │   ├── components/allotment-group-list-presenter/
        │       │   │   │   │   ├── allotment-group-list-presenter.html
        │       │   │   │   │   ├── allotment-group-list-presenter.spec.ts
        │       │   │   │   │   └── allotment-group-list-presenter.ts
        │       │   │   │   ├── constants/
        │       │   │   │   │   ├── allotment-group-form.config.ts
        │       │   │   │   │   ├── allotment-group.constants.ts
        │       │   │   │   │   ├── list-allotment-group-table.config.ts
        │       │   │   │   │   └── search-allotment-group-form.ts
        │       │   │   │   ├── interfaces/
        │       │   │   │   │   ├── allotment-group-response.ts
        │       │   │   │   │   ├── create-allotment-group-request.ts
        │       │   │   │   │   ├── filter-allotment-group-request.ts
        │       │   │   │   │   └── update-allotment-group-request.ts
        │       │   │   │   └── services/
        │       │   │   │       ├── allotment-group.spec.ts
        │       │   │   │       └── allotment-group.ts
        │       │   │   ├── broker/
        │       │   │   │   ├── components/broker-list-presenter/
        │       │   │   │   │   ├── broker-list-presenter.html
        │       │   │   │   │   ├── broker-list-presenter.spec.ts
        │       │   │   │   │   └── broker-list-presenter.ts
        │       │   │   │   ├── constants/
        │       │   │   │   │   ├── broker-form.config.ts
        │       │   │   │   │   ├── broker.constants.ts
        │       │   │   │   │   ├── list-broker-table.config.ts
        │       │   │   │   │   └── search-broker-form.ts
        │       │   │   │   ├── interfaces/
        │       │   │   │   │   ├── broker-response.ts
        │       │   │   │   │   ├── create-broker-request.ts
        │       │   │   │   │   ├── filter-broker-request.ts
        │       │   │   │   │   └── update-broker-request.ts
        │       │   │   │   └── services/
        │       │   │   │       ├── broker.spec.ts
        │       │   │   │       └── broker.ts
        │       │   │   ├── currencies/
        │       │   │   │   ├── components/currency-list-presenter/
        │       │   │   │   │   ├── currency-list-presenter.html
        │       │   │   │   │   ├── currency-list-presenter.spec.ts
        │       │   │   │   │   └── currency-list-presenter.ts
        │       │   │   │   ├── constants/
        │       │   │   │   │   ├── currency-form.config.ts
        │       │   │   │   │   ├── currency.constants.ts
        │       │   │   │   │   ├── list-currency-table.config.ts
        │       │   │   │   │   └── search-currency-form.ts
        │       │   │   │   ├── interfaces/
        │       │   │   │   │   ├── create-currency-request.ts
        │       │   │   │   │   ├── currency-response.ts
        │       │   │   │   │   ├── filter-currency-request.ts
        │       │   │   │   │   ├── index.ts
        │       │   │   │   │   └── update-currency-request.ts
        │       │   │   │   └── services/
        │       │   │   │       ├── currency.spec.ts
        │       │   │   │       └── currency.ts
        │       │   │   ├── pool/
        │       │   │   │   ├── components/pool-list-presenter/
        │       │   │   │   │   ├── pool-list-presenter.html
        │       │   │   │   │   ├── pool-list-presenter.spec.ts
        │       │   │   │   │   └── pool-list-presenter.ts
        │       │   │   │   ├── constants/
        │       │   │   │   │   ├── list-pool-table.config.ts
        │       │   │   │   │   ├── pool-form.config.ts
        │       │   │   │   │   ├── pool.constants.ts
        │       │   │   │   │   └── search-pool-form.ts
        │       │   │   │   ├── interfaces/
        │       │   │   │   │   ├── create-pool-request.ts
        │       │   │   │   │   ├── filter-pool-request.ts
        │       │   │   │   │   ├── pool-response.ts
        │       │   │   │   │   └── update-pool-request.ts
        │       │   │   │   └── services/
        │       │   │   │       ├── pool.spec.ts
        │       │   │   │       └── pool.ts
        │       │   │   └── team/
        │       │   │       ├── components/team-list-presenter/
        │       │   │       │   ├── team-list-presenter.html
        │       │   │       │   ├── team-list-presenter.spec.ts
        │       │   │       │   └── team-list-presenter.ts
        │       │   │       ├── constants/
        │       │   │       │   ├── list-team-table.config.ts
        │       │   │       │   ├── search-team-form.ts
        │       │   │       │   ├── team-form.config.ts
        │       │   │       │   └── team.constants.ts
        │       │   │       ├── interfaces/
        │       │   │       │   ├── create-team-request.ts
        │       │   │       │   ├── filter-team-request.ts
        │       │   │       │   ├── team-response.ts
        │       │   │       │   └── update-team-request.ts
        │       │   │       └── services/
        │       │   │           ├── team.spec.ts
        │       │   │           └── team.ts
        │       │   └── promissory-note/
        │       │       ├── components/
        │       │       │   ├── promissory-note-form-dialog/
        │       │       │   │   ├── promissory-note-form-dialog.css
        │       │       │   │   ├── promissory-note-form-dialog.html
        │       │       │   │   ├── promissory-note-form-dialog.spec.ts
        │       │       │   │   └── promissory-note-form-dialog.ts
        │       │       │   └── promissory-note-list-presenter/
        │       │       │       ├── promissory-note-list-presenter.html
        │       │       │       ├── promissory-note-list-presenter.spec.ts
        │       │       │       └── promissory-note-list-presenter.ts
        │       │       ├── constants/
        │       │       │   ├── list-promissory-note-table.config.ts
        │       │       │   ├── promissory-note.constants.ts
        │       │       │   └── search-promissory-note-form.ts
        │       │       ├── interfaces/
        │       │       │   ├── create-promissory-note-request.ts
        │       │       │   ├── filter-promissory-note-request.ts
        │       │       │   ├── promissory-note-response.ts
        │       │       │   └── update-promissory-note-request.ts
        │       │       └── services/
        │       │           ├── promissory-note.spec.ts
        │       │           └── promissory-note.ts
        │       └── security/
        │           ├── okta/
        │           │   ├── PERMISSIONS.md
        │           │   ├── auth/
        │           │   │   ├── index.ts
        │           │   │   ├── interfaces/
        │           │   │   │   ├── auth-tokens.interface.ts
        │           │   │   │   ├── index.ts
        │           │   │   │   └── token-exchange.interface.ts
        │           │   │   └── services/
        │           │   │       ├── auth.service.ts
        │           │   │       └── mock-auth.service.ts
        │           │   ├── authorization/
        │           │   │   ├── index.ts
        │           │   │   ├── directives/
        │           │   │   │   └── has-permission.directive.ts
        │           │   │   ├── guards/
        │           │   │   │   └── permission.guard.ts
        │           │   │   └── services/
        │           │   │       └── authorization.service.ts
        │           │   ├── constants/
        │           │   │   ├── index.ts
        │           │   │   ├── permissions.constants.ts
        │           │   │   └── session.constants.ts
        │           │   ├── session/
        │           │   │   ├── index.ts
        │           │   │   ├── constants/
        │           │   │   │   └── session.constants.ts
        │           │   │   ├── interfaces/
        │           │   │   │   ├── index.ts
        │           │   │   │   ├── logout.interface.ts
        │           │   │   │   ├── session-create.interface.ts
        │           │   │   │   ├── session-office.interface.ts
        │           │   │   │   ├── session-refresh.interface.ts
        │           │   │   │   ├── session-team.interface.ts
        │           │   │   │   └── user-info.interface.ts
        │           │   │   └── services/
        │           │   │       └── session.service.ts
        │           │   └── users/
        │           │       ├── index.ts
        │           │       ├── interfaces/
        │           │       │   ├── index.ts
        │           │       │   └── okta-user.interface.ts
        │           │       └── services/
        │           │           └── okta-user.service.ts
        │           ├── permissions/
        │           │   ├── permissions.routes.ts
        │           │   ├── components/permission-management-presenter/
        │           │   │   ├── permission-management-presenter.html
        │           │   │   └── permission-management-presenter.ts
        │           │   ├── constants/
        │           │   │   ├── list-permission-table.config.ts
        │           │   │   ├── permission-form.config.ts
        │           │   │   ├── permission.constants.ts
        │           │   │   └── search-permission-form.ts
        │           │   ├── interfaces/
        │           │   │   ├── create-permission-request.ts
        │           │   │   ├── filter-permission-request.ts
        │           │   │   ├── permission-response.ts
        │           │   │   └── update-permission-request.ts
        │           │   └── services/
        │           │       ├── permission.spec.ts
        │           │       └── permission.ts
        │           ├── roles/
        │           │   ├── roles.routes.ts
        │           │   ├── components/role-management-presenter/
        │           │   │   ├── role-management-presenter.html
        │           │   │   └── role-management-presenter.ts
        │           │   ├── constants/
        │           │   │   ├── list-role-table.config.ts
        │           │   │   ├── role-form.config.ts
        │           │   │   └── role.constants.ts
        │           │   ├── interfaces/
        │           │   │   ├── create-role-request.ts
        │           │   │   ├── filter-role-request.ts
        │           │   │   ├── role-response.ts
        │           │   │   └── update-role-request.ts
        │           │   └── services/
        │           │       └── role.ts
        │           └── users/
        │               ├── users.routes.ts
        │               ├── components/
        │               │   ├── user-create-dialog/
        │               │   │   ├── user-create-dialog.css
        │               │   │   ├── user-create-dialog.html
        │               │   │   ├── user-create-dialog.spec.ts
        │               │   │   └── user-create-dialog.ts
        │               │   └── user-management-presenter/
        │               │       ├── user-management-presenter.html
        │               │       └── user-management-presenter.ts
        │               ├── constants/
        │               │   ├── list-user-table.config.ts
        │               │   ├── search-user-form.ts
        │               │   ├── user-create-form.config.ts
        │               │   ├── user-form.config.ts
        │               │   └── user.constants.ts
        │               ├── interfaces/
        │               │   ├── create-user-request.ts
        │               │   ├── filter-user-request.ts
        │               │   ├── update-user-request.ts
        │               │   ├── user-active-response.ts
        │               │   └── user-response.ts
        │               └── services/
        │                   ├── user.spec.ts
        │                   └── user.ts
        │
        └── shared/
            ├── breadcrumb/
            │   ├── breadcrumb.css
            │   ├── breadcrumb.html
            │   └── breadcrumb.ts
            ├── components/
            │   ├── action-bar/
            │   │   └── action-bar.ts
            │   ├── data-table/
            │   │   └── data-table.ts
            │   ├── filter-section/
            │   │   ├── filter-section.css
            │   │   ├── filter-section.html
            │   │   ├── filter-section.spec.ts
            │   │   └── filter-section.ts
            │   ├── list-page-layout/
            │   │   ├── list-page-layout.css
            │   │   ├── list-page-layout.spec.ts
            │   │   └── list-page-layout.ts
            │   └── page-header/
            │       ├── page-header.css
            │       ├── page-header.html
            │       └── page-header.ts
            ├── composables/
            │   ├── README.md
            │   ├── data/
            │   │   └── use-data-loader.ts
            │   ├── form/
            │   │   ├── use-build-filter.ts
            │   │   ├── use-currency-mask.ts
            │   │   ├── use-customer-type-validation.ts
            │   │   ├── use-form-field.ts
            │   │   ├── use-phone-number-mask.ts
            │   │   └── use-tax-id-mask.ts
            │   ├── list/
            │   │   ├── actions/
            │   │   │   ├── use-list-actions.spec.ts
            │   │   │   └── use-list-actions.ts
            │   │   ├── export/
            │   │   │   ├── use-list-export.spec.ts
            │   │   │   └── use-list-export.ts
            │   │   ├── pagination/
            │   │   │   ├── use-list-pagination.spec.ts
            │   │   │   └── use-list-pagination.ts
            │   │   ├── selection/
            │   │   │   ├── use-list-selection.spec.ts
            │   │   │   └── use-list-selection.ts
            │   │   └── table/
            │   │       └── use-table-data.ts
            │   └── ui/
            │       ├── use-action-dispatcher.ts
            │       └── use-dialog-actions.ts
            ├── constants/
            │   ├── common-fields.ts
            │   ├── common-options.ts
            │   ├── customer.constants.ts
            │   ├── dialog.config.ts
            │   ├── http.constants.ts
            │   ├── test-id.constants.ts
            │   ├── ui.constants.ts
            │   └── validation-patterns.ts
            ├── directives/
            │   ├── currency-mask.directive.ts
            │   └── date-mask.directive.ts
            ├── interfaces/
            │   ├── base-entity.ts
            │   ├── list-api-request.ts
            │   ├── list-api-response.ts
            │   └── page-size.ts
            ├── services/
            │   ├── base-http.service.ts
            │   ├── export.service.ts
            │   └── notification.service.ts
            └── ui/
                ├── INPUT_COMPONENTS.md
                ├── index.ts
                ├── notification-toast.ts
                ├── base-form-field/
                │   └── base-form-field.ts
                ├── button/
                │   ├── button.css
                │   ├── button.html
                │   ├── button.ts
                │   └── button.types.ts
                ├── chip/
                │   ├── chip.css
                │   └── chip.ts
                ├── empty-state/
                │   ├── empty-state.css
                │   └── empty-state.ts
                ├── form-dialog/
                │   ├── FORM_DIALOG_GUIDE.md
                │   ├── form-dialog.css
                │   ├── form-dialog.html
                │   ├── form-dialog.spec.ts
                │   ├── form-dialog.ts
                │   └── form-dialog.types.ts
                ├── input/
                │   ├── input.css
                │   ├── input.html
                │   ├── input.ts
                │   └── input.types.ts
                ├── pagination/
                │   ├── pagination.css
                │   ├── pagination.html
                │   ├── pagination.ts
                │   └── pagination.types.ts
                ├── select/
                │   ├── select.css
                │   ├── select.html
                │   ├── select.ts
                │   └── select.types.ts
                ├── table/
                │   ├── TABLE_GUIDE.md
                │   ├── table.css
                │   ├── table.html
                │   ├── table.ts
                │   └── table.types.ts
                ├── table-skeleton/
                │   ├── table-skeleton.css
                │   ├── table-skeleton.html
                │   ├── table-skeleton.spec.ts
                │   └── table-skeleton.ts
                └── utils/
                    ├── array-display.util.ts
                    ├── csv-export.util.ts
                    ├── customer-type-formatter.util.ts
                    ├── date-format.util.ts
                    ├── file-name.util.ts
                    ├── form-messages.util.ts
                    ├── load-options.util.ts
                    ├── phone-formatter.util.ts
                    ├── selection.util.ts
                    ├── table-cell.util.ts
                    ├── table-column-factory.util.ts
                    └── tax-id-formatter.util.ts