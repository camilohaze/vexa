import { inject, Injectable } from '@angular/core';
import { Job, JobStatus, Paginated } from '@vexa/shared';
import { ApiService } from '../../core/api/api.service';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly api = inject(ApiService);

  /** Server scopes results to the current courier's own jobs. */
  list(params: { status?: JobStatus; page?: number; pageSize?: number } = {}) {
    return this.api.get<Paginated<Job>>('jobs', params as Record<string, string | number>);
  }

  getById(id: string) {
    return this.api.get<Job>(`jobs/${id}`);
  }

  accept(id: string) {
    return this.api.post<Job>(`jobs/${id}/accept`);
  }

  complete(id: string) {
    return this.api.post<Job>(`jobs/${id}/complete`);
  }
}
