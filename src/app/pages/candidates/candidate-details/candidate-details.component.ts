import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApplicationsService } from 'src/app/services/applications.service';
import { environment } from 'src/environments/environment';
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
import { Observable, map, switchMap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  selectedResumeFile: File | null = null;
  locations: any[] = [];
  picturesUrl: string = 'https://inimble-app.s3.us-east-1.amazonaws.com/photos';
  userRole: string | null = null;
  userId: number;
  canView: boolean = false;
  canManage: boolean = false;
  canEdit: boolean = false;
  showFullWorkExperience: boolean = false;
  isCreateMode = false;
  maxFileSize: number =  1 * 1024 * 1024;
  rankingProfiles: any[] = [];
  descriptionOptions = [
    'Lien Negotiator - Office Manager / Administrative Coordinator',
    'Intake Specialist',
    'Medical Records Clerk - Case Manager - Receptionist',
    'Paralegal Personal Injury - Litigation Assistant'
  ];
  descriptionBaseText = 'Out of a base of 100, these are our best matches for legal roles:';
  pendingChanges = signal<any[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public applicationService: ApplicationsService,
    private positionsService: PositionsService,
    private snackBar: MatSnackBar,
    private applicationMatchScoreService: ApplicationMatchScoresService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private dialog: MatDialog,
    private discProfilesService: DiscProfilesService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loader.started = true;
    const param = this.route.snapshot.paramMap.get('id');
    this.isCreateMode = param === 'new';

    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      descriptionOption: [''],
      talent_match_profile_summary: [''],
      profile_observation: [''],
      ranking_id: [''],
      position_id: ['', Validators.required],
      profile_pic: [''],
      interview_link: [''],
      hobbies: [''],
      work_experience: ['', Validators.maxLength(1000)],
      skills: ['', Validators.required],
      education_history: [''],
      inimble_academy: [''],
      english_level: ['', Validators.required]
    });
    this.applicationService.getRankings().subscribe({
      next: (rankings) => {
        this.rankingProfiles = rankings;
        this.setupFormValueListeners();
      },
      error: (err) => console.error('Error loading rankings', err)
    });
    this.loadPositions();
    this.userRole = localStorage.getItem('role');
    this.userId = Number(localStorage.getItem('id'));
    this.loadPermissions();
    if (this.isCreateMode) {
      this.editMode = true;
      this.candidate.set(null);
      this.originalData = this.form.value;
      this.loader.complete = true;
      return;
    }
    const candidateId = Number(param);
    this.loadCandidateApplications(candidateId);
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

  private loadPermissions() {
    this.permissionService.getUserPermissions(this.userId).subscribe({
      next: (userPerms: any) => {
        const effective = userPerms.effectivePermissions || [];
        this.canManage = effective.includes('candidates.manage');
        this.canEdit = effective.includes('candidates.edit');
        this.canView = effective.includes('candidates.view');
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
          pending_updates: candidate.pending_updates || null,
          resume_url: candidate.resume_url || candidate.file_name || null
        };

        this.candidate.set(normalizedCandidate);
        const rankingObj = this.rankingProfiles.find(r => r.id === candidate.ranking_id);

        let descriptionValue = '';
        let selectedOption = '';
        
        if (candidate.description) {
          if (candidate.description.includes(this.descriptionBaseText)) {
            const parts = candidate.description.split(this.descriptionBaseText);
            if (parts[1] && parts[1].trim()) {
              selectedOption = parts[1].trim();
            }
            descriptionValue = candidate.description;
          } else {
            descriptionValue = candidate.description;
            selectedOption = candidate.description;
          }
        }

        this.form.patchValue({
          name: candidate.name,
          description: descriptionValue,
          descriptionOption: selectedOption,
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
    let descriptionValue = '';
    let selectedOption = '';
    
    if (candidate.description) {
      if (candidate.description.includes(this.descriptionBaseText)) {
        const parts = candidate.description.split(this.descriptionBaseText);
        if (parts[1] && parts[1].trim()) {
          selectedOption = parts[1].trim();
        }
        descriptionValue = candidate.description;
      } else {
        descriptionValue = candidate.description;
        selectedOption = candidate.description;
      }
    }

    const rankingObj = this.rankingProfiles.find(r => r.id === candidate.ranking_id);
    this.form.patchValue({
      name: candidate.name,
      description: descriptionValue,
      descriptionOption: selectedOption,
      talent_match_profile_summary: candidate.talent_match_profile_summary,
      ranking_id: candidate.ranking_id || (rankingObj ? rankingObj.id : null),
      profile_observation: rankingObj ? rankingObj.profile_observation : candidate.profile_observation,
      position_id: candidate.position_id,
      profile_pic: this.selectedProfilePicFile,
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

  private getFieldLabel(key: string): string {
    const labels: Record<string, string> = {
      full_name: 'Name:',
      phone: 'Phone',
      english_level: 'English Level',
      skills: 'Skills',
      schedule_availability: 'Schedule Availability',
      location_id: 'Location',
      hobbies: 'Hobbies',
      work_experience: 'Work Experience',
      education_history: 'Education History',
      applied_where: 'Applied Where',
      referred: 'Referred',
      age: 'Age',
      address: 'Address',
      children: 'Children',
      competencies: 'Competencies',
      tech_proficiency: 'Tech Proficiency',
      work_references: 'Work References',
      salary_range: 'Salary Range',
      resume: 'Resume',
      programming_languages: 'Programming Languages'
    };
    return labels[key] || key;
  }

  private getFieldValue(key: string, value: any): any {
    if (key === 'location_id') {
      const loc = this.locations.find(l => l.id === Number(value));
      return loc ? `${loc.city}, ${loc.country}` : value;
    }
    if (key === 'schedule_availability') {
      return value ? 'Yes' : 'No';
    }
    return value;
  }

  enterEditMode() {
    this.editMode = true;
  }

  cancelEdit() {
    if (this.isCreateMode) {
      this.router.navigate(['apps/candidates']);
      return;
    }
    
    this.form.patchValue(this.originalData);
    
    if (this.originalData?.profile_pic) {
      const originalCandidate = {
        ...this.candidate(),
        picture: this.originalData.profile_pic,
        profile_pic_url: this.originalData.profile_pic
      };
      this.candidate.set(originalCandidate);
    }
    
    this.selectedProfilePicFile = null;
    this.selectedResumeFile = null;
    
    this.editMode = false;
  }

  getSelectedDescriptionOption(): string {
    const description = this.candidate()?.description || '';
    if (!description.includes(this.descriptionBaseText)) {
      return description;
    }
    
    const parts = description.split(this.descriptionBaseText);
    return parts[1] ? parts[1].trim() : '';
  }


  private createCandidate() {
    const payload = {
      ...this.form.value,
      status_id: 1
    };
    this.applicationService.submit(payload).subscribe({
      next: (candidate: any) => {
        this.snackBar.open('Candidate created successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['apps/candidates']);
      },
      error: () => {
        this.snackBar.open('Error creating candidate', 'Close', { duration: 3000 });
      }
    });
  }

  private updateCandidate() {
    const id = this.candidate()?.id;
    if (!id) return;

    const formValues = this.form.value;

    const selectedOption = this.form.value.descriptionOption;
    let descriptionValue = this.descriptionBaseText;
    
    if (selectedOption && selectedOption.trim()) {
      descriptionValue = `${this.descriptionBaseText} ${selectedOption}`;
    }

    const data: any = {
      name: formValues.name,
      description: descriptionValue,
      talent_match_profile_summary: formValues.talent_match_profile_summary,
      profile_observation: formValues.profile_observation,
      ranking_id: formValues.ranking_id,
      position_id: formValues.position_id,
      interview_link: formValues.interview_link,
      hobbies: formValues.hobbies,
      work_experience: formValues.work_experience,
      skills: formValues.skills,
      education_history: formValues.education_history,
      inimble_academy: formValues.inimble_academy,
      english_level: formValues.english_level,
      email: this.candidate()?.email,
      cv: this.selectedResumeFile
    };

    if (this.selectedProfilePicFile) {
      data.profile_pic = this.selectedProfilePicFile;
    } else if (formValues.profile_pic) {
      data.profile_pic = formValues.profile_pic;
    }

    this.applicationService.submit(data, id).subscribe({
      next: (response: any) => {
        this.snackBar.open('Candidate updated successfully!', 'Close', { duration: 3000 });
        this.editMode = false;
        
        const updatedCandidate = {
          ...this.candidate(),
          ...data,
          description: descriptionValue,
          resume_url: response?.resume || response?.file_name || this.candidate()?.resume_url
        };
        
        this.candidate.set(updatedCandidate);

        this.originalData = JSON.parse(JSON.stringify(this.form.value));
        
        if (response?.profile_pic_url) {
          const updatedCandidate = {
            ...this.candidate(),
            picture: response.profile_pic_url,
            profile_pic_url: response.profile_pic_url
          };
          this.candidate.set(updatedCandidate);
          
          this.form.patchValue({
            profile_pic: response.profile_pic_url
          });
        }
        
        this.selectedProfilePicFile = null;
        this.selectedResumeFile = null;
      },
      error: (error) => {
        console.error('Error updating candidate:', error);
        this.snackBar.open('Error updating candidate', 'Close', { duration: 3000 });
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    const selectedOption = this.form.value.descriptionOption;
    let descriptionValue = this.descriptionBaseText;
    
    if (selectedOption && selectedOption.trim()) {
      descriptionValue = `${this.descriptionBaseText} ${selectedOption}`;
    }
    
    this.form.patchValue({
      description: descriptionValue
    });
    
    if (this.isCreateMode) {
      this.createCandidate();
    } else {
      this.updateCandidate();
    }
  }



  getLocations() {
    this.applicationService.getLocations().subscribe({
      next: (locs) => {
        this.locations = locs;
      },
      error: (err) => console.error('Error loading locations', err)
    });
  }

  getPositionTitle(positionId: number) {
    return this.positions.find(p => p.id === positionId)?.title || 'N/A';
  }

  getPositionById(positionId: any): any {
    return this.positions.find(p => p.id == positionId);
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

  getProfileByRanking(ranking: string) {
    return this.rankingProfiles.find(p => p.key === ranking);
  }

  getProfileByDescription(description: string) {
    return this.rankingProfiles.find(p => p.description === description);
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

  getResumeUrl(filename: string | null | undefined): string {
    return this.applicationService.getResumeUrl(filename);
  }

  approveChanges() {
    const candidateId = this.candidate()?.id;
    if (!candidateId) return;
    this.applicationService.approveApplicationUpdates(candidateId).subscribe({
      next: (res: any) => {
        const applied = res?.applied_updates || {};
        const candidate = this.candidate();
        const updatedCandidate = {
          ...candidate,
          ...applied,
          pending_updates: null,
          pending_update_status: 'approved'
        };
        this.candidate.set(updatedCandidate);
        this.applicationService.notifyApplicationUpdated(updatedCandidate);
        this.pendingChanges.set([]);
        this.applicationMatchScoreService.getByApplicationId(candidateId)
          .subscribe(scores => this.matchScores = scores);
        this.applicationMatchScoreService.getPositionCategories()
          .subscribe(categories => this.positionCategories = categories);
        this.form.patchValue({
          name: updatedCandidate.name,
          description: updatedCandidate.description,
          talent_match_profile_summary: updatedCandidate.talent_match_profile_summary,
          position_id: updatedCandidate.position_id,
          interview_link: updatedCandidate.interview_link,
          hobbies: updatedCandidate.hobbies,
          work_experience: updatedCandidate.work_experience,
          skills: updatedCandidate.skills,
          education_history: updatedCandidate.education_history,
          inimble_academy: updatedCandidate.inimble_academy,
          english_level: updatedCandidate.english_level,
          resume: updatedCandidate.resume
        });
        this.originalData = JSON.parse(JSON.stringify(this.form.value));
        this.snackBar.open('Pending changes approved!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to approve changes', err);
        this.snackBar.open('Failed to approve changes', 'Close', { duration: 3000 });
      }
    });
  }

  rejectChanges() {
    const candidateId = this.candidate()?.id;
    if (!candidateId) return;
    this.applicationService.rejectApplicationUpdates(candidateId).subscribe({
      next: (res: any) => {
        const candidate = this.candidate();
        const updatedCandidate = {
          ...candidate,
          pending_updates: null,
          pending_update_status: 'rejected'
        };
        this.candidate.set(updatedCandidate);
        this.applicationService.notifyApplicationUpdated(updatedCandidate);
        this.pendingChanges.set([]);
        this.applicationMatchScoreService.getByApplicationId(candidateId)
          .subscribe(scores => this.matchScores = scores);
        this.snackBar.open('Pending changes rejected!', 'Close', { duration: 3000 });
        this.form.patchValue(this.originalData);
      },
      error: (err) => {
        console.error('Failed to reject changes', err);
        this.snackBar.open('Failed to reject changes', 'Close', { duration: 3000 });
      }
    });
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
      if (result?.success && result.profile_pic) {
        const updatedCandidate = {
          ...this.candidate(),
          picture: result.profile_pic,
          profile_pic_url: result.profile_pic
        };
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

  onProfilePicSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > this.maxFileSize) {
        this.snackBar.open(
          'Profile picture size should be 1 MB or less',
          'Close',
          { duration: 3000 }
        );
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)){
        this.snackBar.open(
          'Only JPG and PNG files are allowed for profile picture',
          'Close',
          { duration: 3000 }
        );
        return;
      }
      
      this.selectedProfilePicFile = file;
    }
  }

  onResumeSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > this.maxFileSize) {
        this.snackBar.open(
          'Resume size should be 1 MB or less',
          'Close',
          { duration: 3000 }
        );
        return;
      }
      
      const allowedTypes = [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
         this.snackBar.open(
          'Should be a .doc, .docx or .pdf file',
          'Close',
          { duration: 3000 }
        );
        return;
      }
      
      this.selectedResumeFile = file;
    }
  }
}