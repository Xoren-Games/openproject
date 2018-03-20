import {WorkPackageResourceInterface} from 'app/components/api/api-v3/hal-resources/work-package-resource.service';
import {
  GroupObject,
  WorkPackageCollectionResource
} from 'app/components/api/api-v3/hal-resources/wp-collection-resource.service';
import {RenderedRow} from 'app/components/wp-fast-table/builders/primary-render-pass';
import {WorkPackageTableColumns} from 'app/components/wp-fast-table/wp-table-columns';
import {WorkPackageTableFilters} from 'app/components/wp-fast-table/wp-table-filters';
import {WorkPackageTableGroupBy} from 'app/components/wp-fast-table/wp-table-group-by';
import {WorkPackageTableHierarchies} from 'app/components/wp-fast-table/wp-table-hierarchies';
import {WorkPackageTablePagination} from 'app/components/wp-fast-table/wp-table-pagination';
import {WorkPackageTableRelationColumns} from 'app/components/wp-fast-table/wp-table-relation-columns';
import {WorkPackageTableSortBy} from 'app/components/wp-fast-table/wp-table-sort-by';
import {WorkPackageTableSum} from 'app/components/wp-fast-table/wp-table-sum';
import {WorkPackageTableTimelineState} from 'app/components/wp-fast-table/wp-table-timeline';
import {WPTableRowSelectionState} from 'app/components/wp-fast-table/wp-table.interfaces';
import {combine, derive, input, State, StatesGroup} from 'reactivestates';
import {Subject} from 'rxjs/Rx';
import {States} from 'core-components/states.service';
import {Injectable} from '@angular/core';
import {QueryResource} from 'core-components/api/api-v3/hal-resources/query-resource.service';
import {opServicesModule} from 'core-app/angular-modules';
import {downgradeInjectable} from '@angular/upgrade/static';

@Injectable()
export class TableState extends StatesGroup {

  constructor(readonly states:States) {
    super();
  }

  name = 'TableStore';

  // The query that results in this table state
  query = input<QueryResource>();

  // the results associated with the table
  results = input<WorkPackageCollectionResource>();
  // Set of work package IDs in strict order of appearance
  rows = input<WorkPackageResourceInterface[]>();
  // all groups returned as results
  groups = input<GroupObject[]>();
  // Set of columns in strict order of appearance
  columns = input<WorkPackageTableColumns>();

  // Set of filters
  filters = input<WorkPackageTableFilters>();
  // Active and available sort by
  sortBy = input<WorkPackageTableSortBy>();
  // Active and available group by
  groupBy = input<WorkPackageTableGroupBy>();
  // is query summed
  sum = input<WorkPackageTableSum>();
  // pagination information
  pagination = input<WorkPackageTablePagination>();
  // Table row selection state
  selection = input<WPTableRowSelectionState>();
  // Current state of collapsed groups (if any)
  collapsedGroups = input<{ [identifier:string]:boolean }>();
  // Hierarchies of table
  hierarchies = input<WorkPackageTableHierarchies>();
  // State to be updated when the table is up to date
  rendered = input<RenderedRow[]>();

  renderedWorkPackages:State<RenderedRow[]> = derive(this.rendered, $ => $
    .map(rows => rows.filter(row => !!row.workPackageId)));

  // State to determine timeline visibility
  timelineVisible = input<WorkPackageTableTimelineState>();

  // auto zoom toggle
  timelineAutoZoom = input<boolean>(true);

  // Subject used to unregister all listeners of states above.
  stopAllSubscriptions = new Subject();
  // Fire when table refresh is required
  refreshRequired = input<boolean[]>();

  // Expanded relation columns
  relationColumns = input<WorkPackageTableRelationColumns>();

  // Required work packages to be rendered by hierarchy mode + relation columns
  additionalRequiredWorkPackages = input<null>();

  tableRendering = new TableRenderingStates(this);

  // Updater states on user input
  updates = new UserUpdaterStates(this);
}

opServicesModule.service('globalTableState', downgradeInjectable(TableState));

export class TableRenderingStates {
  constructor(private tableState:TableState) {
  }

  // State when all required input states for the current query are ready
  private combinedTableStates = combine(
    this.tableState.rows,
    this.tableState.columns,
    this.tableState.sum,
    this.tableState.groupBy,
    this.tableState.sortBy,
    this.tableState.additionalRequiredWorkPackages
  );

  onQueryUpdated = derive(this.combinedTableStates, ($, input) => $.mapTo(null));

}

export class UserUpdaterStates {

  constructor(private tableState:TableState) {
  }

  columnsUpdates = this.tableState.states.query.context.fireOnStateChange(this.tableState.columns,
    'Query loaded');

  hierarchyUpdates = this.tableState.states.query.context.fireOnStateChange(this.tableState.hierarchies,
    'Query loaded');

  relationUpdates = this.tableState.states.query.context.fireOnStateChange(this.tableState.relationColumns,
    'Query loaded');
}
