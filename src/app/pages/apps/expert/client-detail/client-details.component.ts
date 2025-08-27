import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-client-details',
  styleUrls: ['./client-details.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './client-details.component.html',
})
export class ClientDetailsComponent implements OnInit {
  @Output() back = new EventEmitter<void>();
  private _client: any;
  departmentsList: string = '';
  defaultLogo = 'assets/inimble.png';

  @Input()
  set client(value: any) {
    this._client = value;
    if (value?.company?.departments?.length) {
      this.departmentsList = value.company.departments.map((d: any) => d.name).join(', ');
    } else {
      this.departmentsList = '';
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
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    const preselected = this.usersService.getSelectedUser();
    if (preselected?.id === id) {
      this.client = preselected;
      this.loadCompany(id);
      return;
    }

    this.usersService.getUsers({ filter: { id } }).subscribe(users => {
      const found = Array.isArray(users) ? users.find((u: any) => u.id === id) : null;
      if (found) {
        this.client = found;
        this.loadCompany(id);
      } else {
        this.router.navigate(['/apps/expert']);
      }
    });
  }

  private loadCompany(userId: number) {
    this.companiesService.getByUserId(userId).subscribe((ownerResp: any) => {
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
}