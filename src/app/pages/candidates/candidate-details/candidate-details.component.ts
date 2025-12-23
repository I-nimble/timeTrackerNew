import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApplicationsService } from 'src/app/services/applications.service';
import { ApplicationMatchScoresService, MatchScore, PositionCategory } from 'src/app/services/application-match-scores.service';
import { Loader } from 'src/app/app.models';
import { PositionsService } from 'src/app/services/positions.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PermissionService } from 'src/app/services/permission.service';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatchPercentagesModalComponent, MatchPercentagesModalData } from 'src/app/components/match-percentages-modal/match-percentages-modal.component';
import { DiscProfilesService } from 'src/app/services/disc-profiles.service';
import { AddCandidateDialogComponent } from '../../talent-match-admin/new-candidate-dialog/add-candidate-dialog.component';

@Component({
  selector: 'app-candidate-details',
  templateUrl: './candidate-details.component.html',
  styleUrls: ['./candidate-details.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    MatTableModule,
    MatIconModule,
    MatCardModule,
    LoaderComponent,
    DatePipe,
    UpperCasePipe,
    FormsModule,
    ReactiveFormsModule   
  ]
})

export class CandidateDetailsComponent implements OnInit {
  candidate = signal<any>(null);
  applications: any[] = [];
  positions: any[] = [];
  loader = new Loader(false, false, false);
  message = '';
  matchScores: MatchScore[] = [];
  positionCategories: PositionCategory[] = [];
  editMode = false;
  form!: FormGroup;
  originalData: any;
  selectedProfilePicFile: File | null = null;
  locations: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  userRole: string | null = null;
  userId: number;
  canView: boolean = false;
  canManage: boolean = false;
  canEdit: boolean = false;
  showFullWorkExperience: boolean = false;
  rankingProfiles: any[] = [];

  constructor(
    private route: ActivatedRoute,
    public applicationService: ApplicationsService,
    private positionsService: PositionsService,
    private snackBar: MatSnackBar,
    private applicationMatchScoreService: ApplicationMatchScoresService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private dialog: MatDialog,
    private discProfilesService: DiscProfilesService
  ) { }

  ngOnInit(): void {
    this.loader.started = true;
    const candidateId = +this.route.snapshot.paramMap.get('id')!;
    if (!candidateId) {
      this.loader.complete = true;
      this.loader.error = true;
      this.message = 'Candidate not found.';
      return;
    }

    this.form = this.fb.group({
      name: [''],
      description: [''],
      talent_match_profile_summary: [''],
      profile_observation: [''],
      ranking_id: [''],
      position_id: [''],
      profile_pic: [''],
      interview_link: [''],
      hobbies: [''],
      work_experience: ['', Validators.maxLength(1000)],
      skills: [''],
      education_history: [''],
      inimble_academy: [''],
      english_level: ['']
    });
    this.applicationService.getRankings().subscribe({
      next: (rankings) => {
        this.rankingProfiles = rankings;
        this.setupFormValueListeners();
      },
      error: (err) => console.error('Error loading rankings', err)
    });
    this.loadPositions();
    this.loadCandidateApplications(candidateId);
    this.userRole = localStorage.getItem('role');
    this.userId = Number(localStorage.getItem('id'));
    this.permissionService.getUserPermissions(this.userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canManage = effective.includes('candidates.manage');
        this.canEdit = effective.includes('candidates.edit');
        this.canView = effective.includes('candidates.view');
      },
      error: (err) => {
        console.error('Error fetching user permissions', err);
      },
    });
  }

  private loadPositions() {
    this.positionsService.get().subscribe({
      next: positions => this.positions = positions,
      error: err => console.error('Error loading positions', err)
    });
  }

  private setupFormValueListeners() {
    this.form.get('ranking_id')?.valueChanges.subscribe((rankingId) => {
      if (!this.editMode) return;
      const profile = this.rankingProfiles.find(r => r.id === +rankingId);
      if (profile && this.form.value.profile_observation !== profile.profile_observation) {
        this.form.patchValue(
          { profile_observation: profile.profile_observation },
          { emitEvent: false }
        );
      }
    });
    this.form.get('profile_observation')?.valueChanges.subscribe((desc) => {
      if (!this.editMode) return;
      const profile = this.rankingProfiles.find(r => r.profile_observation === desc);
      if (profile && this.form.value.ranking_id !== profile.id) {
        this.form.patchValue(
          { ranking_id: profile.id },
          { emitEvent: false }
        );
      }
    });
  }

  private loadCandidateApplications(candidateId: number) {
    this.applicationService.get().subscribe({
      next: (applications) => {
        const candidate = applications.find(
          a => a.id === candidateId || a.application_id === candidateId
        );

        if (!candidate) {
          this.loader.complete = true;
          this.loader.error = true;
          this.message = 'Candidate not found.';
          return;
        }

        this.candidate.set(candidate);

        const normalizedCandidate = {
          ...candidate,
          picture: candidate.picture || candidate.profile_pic_url || null,
          profile_pic_url: candidate.profile_pic_url || candidate.picture || null,
        };

        this.candidate.set(normalizedCandidate);
        const rankingObj = this.rankingProfiles.find(r => r.id === candidate.ranking_id);
        this.form.patchValue({
          name: candidate.name,
          description: candidate.description,
          talent_match_profile_summary: candidate.talent_match_profile_summary,
          ranking_id: candidate.ranking_id || (rankingObj ? rankingObj.id : null),
          profile_observation: rankingObj ? rankingObj.profile_observation : candidate.profile_observation,
          position_id: candidate.position_id,
          profile_pic: normalizedCandidate.picture,
          interview_link: candidate.interview_link,
          hobbies: candidate.hobbies,
          work_experience: candidate.work_experience,
          skills: candidate.skills,
          education_history: candidate.education_history,
          inimble_academy: candidate.inimble_academy,
          english_level: candidate.english_level
        });
        this.originalData = JSON.parse(JSON.stringify(this.form.value));
        this.applicationMatchScoreService.getByApplicationId(candidate.id)
          .subscribe(scores => {
            this.matchScores = scores;
            scores.forEach(score => {
              const controlName = 'matchScores_' + score.id;
              if (!this.form.get(controlName)) {
                this.form.addControl(controlName, new FormControl(score.match_percentage));
              }
            });
          });

        this.applicationMatchScoreService.getPositionCategories()
          .subscribe(categories => this.positionCategories = categories);

        this.loader.complete = true;
      },
      error: (err) => {
        console.error('Error loading applications', err);
        this.loader.complete = true;
        this.loader.error = true;
        this.message = 'Failed to load candidate applications.';
      }
    });
  }

  initializeForm(candidate: any) {
    const rankingObj = this.rankingProfiles.find(r => r.id === candidate.ranking_id);
    this.form.patchValue({
      name: candidate.name,
      description: candidate.description,
      talent_match_profile_summary: candidate.talent_match_profile_summary,
      ranking_id: candidate.ranking_id || (rankingObj ? rankingObj.id : null),
      profile_observation: rankingObj ? rankingObj.profile_observation : candidate.profile_observation,
      position_id: candidate.position_id,
      profile_pic: candidate.picture || candidate.profile_pic_url || null,
      interview_link: candidate.interview_link,
      hobbies: candidate.hobbies,
      work_experience: candidate.work_experience,
      skills: candidate.skills,
      education_history: candidate.education_history,
      inimble_academy: candidate.inimble_academy,
      english_level: candidate.english_level
    });

    this.originalData = JSON.parse(JSON.stringify(this.form.value));
  }

  get f() {
    return this.form.controls as { [key: string]: FormControl };
  }

  enterEditMode() {
    this.editMode = true;
  }

  cancelEdit() {
    this.form.patchValue(this.originalData);
    this.editMode = false;
  }

  save() {
    const id = this.candidate()?.id;
    if (!id) return;

    this.applicationService.submit(this.form.value, id).subscribe({
      next: (res) => {
        const updatedCandidate = { ...this.candidate(), ...this.form.value };
        if (this.form.value.profile_pic) {
          updatedCandidate.picture = this.form.value.profile_pic;
        }
        updatedCandidate.profile_pic_url = updatedCandidate.picture;
        this.candidate.set(updatedCandidate);
        this.originalData = JSON.parse(JSON.stringify(this.form.value));        
        this.snackBar.open('Candidate updated successfully!', 'Close', { duration: 3000 });
        this.applicationService.notifyApplicationUpdated(updatedCandidate);
        this.editMode = false;
      },
      error: () => {
        this.snackBar.open('Error updating candidate', 'Close', { duration: 3000 });
      }
    });
  }

  getPositionTitle(positionId: number) {
    return this.positions.find(p => p.id === positionId)?.title || 'N/A';
  }

  getCategoryName(score: MatchScore): string {
    const category = this.positionCategories.find(cat => cat.id === score.position_category_id);
    return category ? category.category_name : 'Unknown';
  }

  getRankingName(rankingId: number | undefined): string {
    const ranking = this.rankingProfiles.find(r => r.id === rankingId);
    return ranking ? ranking.ranking : '';
  }

  getProfileObservation(rankingId: number | undefined): string {
    const ranking = this.rankingProfiles.find(r => r.id === rankingId);
    return ranking ? ranking.profile_observation : '';
  }

  getDiscProfileColor(profileName: string): string {
    return this.discProfilesService.getDiscProfileColor(profileName);
  }

  getDiscProfileNames(profiles: any[] | undefined): string {
    if (!profiles || profiles.length === 0) return '';
    return profiles.map(p => p.name).join(', ');
  }

  breakLines(value: string | null): string[] {
    if (!value) return [];
    return value.split(/\r?\n/);
  }

  getSafeLink(url?: string | null): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) return trimmed;
    
    if (!trimmed.includes('/') && this.candidate()) {
       const userId = this.candidate().user?.id || this.candidate().user_id;
       if (userId) {
          return `${this.applicationService.API_URI}/profile/${userId}`;
       } else {
          return `${this.applicationService.API_URI}/profile/app-${this.candidate().id}`;
       }
    }
    
    return `${this.applicationService.API_URI}/profile/${this.candidate().id}`;
  }

  openDialogUploadFiles() {
    const candidate = this.candidate();
    if (!candidate) return;

    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '600px',
      data: {
        mode: 'files',
        candidate: candidate,
        action: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        let updatedCandidate = { ...this.candidate() };
        
        if (result.candidate) {
            updatedCandidate = { ...updatedCandidate, ...result.candidate };
        }
        
        if (result.profile_pic) {
            updatedCandidate.picture = result.profile_pic;
        }

        const userId = updatedCandidate.user?.id || updatedCandidate.user_id;
        updatedCandidate.profile_pic_url = userId 
            ? `${this.applicationService.API_URI}/profile/${userId}`
            : `${this.applicationService.API_URI}/profile/app-${updatedCandidate.id}`;

        this.candidate.set(updatedCandidate);
        this.snackBar.open('Candidate picture updated!', 'Close', { duration: 3000 });
      }
    });
  }

  openMatchPercentagesModal(): void {
    const candidate = this.candidate();
    if (!candidate) return;

    const dialogData: MatchPercentagesModalData = {
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email || '',
        position_id: candidate.position_id,
        disc_profiles: candidate.disc_profiles || []
      }
    };

    const dialogRef = this.dialog.open(MatchPercentagesModalComponent, {
      width: '600px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.applicationMatchScoreService.getByApplicationId(candidate.id)
          .subscribe(scores => {
            this.matchScores = scores;
            scores.forEach(score => {
              const controlName = 'matchScores_' + score.id;
              if (this.form.get(controlName)) {
                this.form.get(controlName)?.setValue(score.match_percentage);
              }
            });
          });
        
        if (result.discProfiles) {
          this.candidate.update(c => ({
            ...c!,
            disc_profiles: result.discProfiles
          }));
        }
        
        this.snackBar.open('Match percentages and DISC profile updated!', 'Close', { duration: 3000 });
      }
    });
  }
}