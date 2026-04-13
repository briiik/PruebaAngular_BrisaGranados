import { Directive, Input, OnInit, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {

  private permission = '';
  private groupId?: string;
  private hasView   = false;

  // Uso básico: *appHasPermission="'ticket:create'"
  @Input() set appHasPermission(permission: string) {
    this.permission = permission;
    this.updateView();
  }

  // Uso con grupo: *appHasPermission="'ticket:create'; group: grupoId"
  @Input() set appHasPermissionGroup(groupId: string) {
    this.groupId = groupId;
    this.updateView();
  }

  constructor(
    private templateRef:     TemplateRef<any>,
    private viewContainer:   ViewContainerRef,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.viewContainer.clear();
  }

  private updateView(): void {
    const tiene = this.permissionService.hasPermission(this.permission, this.groupId);

    if (tiene && !this.hasView) {
      // Renderiza el elemento en el DOM
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!tiene && this.hasView) {
      // Elimina el elemento del DOM completamente
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}