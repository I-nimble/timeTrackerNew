import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IntakeService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/intake';

  public submit(data: any) {
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

    return this.http.post(`${this.API_URI}`, body);
  }
}
