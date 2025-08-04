import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IntakeService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/intake';

  public submitIntake(data: any) {
    const body = {
      client: data.client,
      contact_person: data.contactPerson,
      email: data.email,
      phone: data.countryCode + ' ' + data.phone,
      website: data.website,
      industry: data.industry,
      number_of_employees: data.numberOfEmployees,
      job_title: data.jobTitle,
      job_description: data.jobDescription,
      kpi: data.kpi,
      competencies: data.competencies.join(', '),
      training_contact: data.trainingContact,
      it_contact: data.itContact,
      tech_needs: data.techNeeds,
      additional_info: data.additionalInfo,
      schedule_days: data.scheduleDays.join(', '),
      schedule: data.scheduleStart + ' - ' + data.scheduleEnd,
      lunchtime: data.lunchTime,
      holidays_observed: data.holidaysObserved.join(', '),
    }

    return this.http.post(`${this.API_URI}`, body);
  }

  public submitDiscovery(data: any) {
    const body = {
      company_name: data.companyName,
      contact_name: data.name,
      email: data.email,
      phone: data.countryCode + ' ' + data.phone,
      job_name_description: data.jobNameAndDescription,
      required_skills_category: data.requiredSkillsCategory + (data.otherSkillsCategory ? ` (${data.otherSkillsCategory})` : ''),
      required_skills: data.requiredSkills.join(', '),
      routine_oriented: data.routineOriented,
      social_oriented: data.socialOriented,
      decision_making: data.decisionMaking,
      attention_to_detail: data.attentionToDetail,
      management_style: data.managementStyle,
      feedback_style: data.feedbackStyle,
      communication_style: data.communicationStyle,
      conflict_handling: data.conflictHandling
    }

    return this.http.post(`${this.API_URI}/discovery`, body);
  }
}
