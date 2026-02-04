import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { MaterialModule } from 'src/app/material.module';
import { PlansService } from 'src/app/services/plans.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-client-details',
  styleUrls: ['./client-details.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MaterialModule],
  templateUrl: './client-details.component.html',
})
export class ClientDetailsComponent implements OnInit, OnDestroy {
  @Output() back = new EventEmitter<void>();
  private _client: any;
  departmentsList: string = '';
  defaultLogo = 'assets/inimble.png';
  plan: string = '';
  private loadingCompanyForUserId: number | null = null;
  private destroy$ = new Subject<void>();

  @Input()
  set client(value: any) {
    this._client = value;
    if (value?.company?.departments?.length) {
      this.departmentsList = value.company.departments.map((d: any) => d.name).join(', ');
    } else {
      this.departmentsList = '';
    }
    if (value && value.id) {
      const missingCompanyInfo = !value.company || !value.company.id || !value.company.departments;
      if (missingCompanyInfo && this.loadingCompanyForUserId !== Number(value.id)) {
        this.loadCompany(Number(value.id));
      }
    }
  }

  get client() {
    return this._client;
  }

  get companySocials(): { name: string, url: string, iconClass: string }[] {
    const sm = this.client?.company?.social_media;
    if (!sm) return [];
    return [
      { name: 'Instagram', url: sm.instagram, iconClass: 'bi bi-instagram' },
      { name: 'Facebook',  url: sm.facebook,  iconClass: 'bi bi-facebook' },
      { name: 'LinkedIn',  url: sm.linkedin,  iconClass: 'bi bi-linkedin' },
      { name: 'Twitter',   url: sm.twitter,   iconClass: 'bi bi-twitter' },
    ].filter(s => !!s.url);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private plansService: PlansService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (!id) return;

      const currentPlan = this.plansService.getCurrentPlanValue();
      this.plan = currentPlan?.name || this.plan;

      const preselected = this.usersService.getSelectedUser();
      if (preselected && Number(preselected.id) === id) {
        this.client = preselected;
      }

      this.usersService.getUsers({ filter: { id } }).pipe(takeUntil(this.destroy$)).subscribe(users => {
        const found = Array.isArray(users) ? users.find((u: any) => Number(u.id) === id) : null;
        if (found) {
          this.client = found;
          this.loadCompany(id);
        } else {
          if (this.client && this.client.id) {
            this.loadCompany(id);
          } else {
            this.router.navigate(['/apps/expert']);
          }
        }
      }, (err) => {
        if (this.client && this.client.id) {
          this.loadCompany(id);
        } else {
          this.router.navigate(['/apps/expert']);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCompany(userId: number) {
    if (this.loadingCompanyForUserId === userId) return;
    this.loadingCompanyForUserId = userId;
    this.companiesService.getByUserId(userId).subscribe((ownerResp: any) => {
      console.log('[ClientDetails] company response for userId', userId, ownerResp);
      const fullCompany = ownerResp?.company || this.client?.company;
      if (fullCompany) {
        this.client.company = { ...this.client.company, ...fullCompany };
        if (this.client.company.id) {
          this.companiesService.getCompanyLogo(this.client.company.id)
            .subscribe((safeUrl: any) => {
              try {
                this.client.company.logoUrl = safeUrl?.changingThisBreaksApplicationSecurity || this.defaultLogo;
              } catch {
                this.client.company.logoUrl = this.defaultLogo;
              }
            });
        } else {
          this.client.company.logoUrl = this.defaultLogo;
        }
      }
      this.loadingCompanyForUserId = null;
    }, () => {
      this.loadingCompanyForUserId = null;
    });
  }

  ngOnChanges(): void {
    if (this.client?.company?.departments) {
      this.departmentsList = this.client.company.departments
        .map((d: any) => d.name)
        .join(', ');
    } else {
      this.departmentsList = '';
    }
  }

  get canShowContact(): boolean {
    return (this.plan || '').toString().toLowerCase() !== 'basic';
  }
}