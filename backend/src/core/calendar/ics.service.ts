import { Injectable } from '@nestjs/common';
import { createEvents, EventAttributes } from 'ics';

@Injectable()
export class IcsService {
  /**
   * Generate ICS calendar feed for professional (next 60 days)
   */
  generateProfessionalFeed(
    appointments: Array<{
      id: string;
      startsAt: Date;
      endsAt: Date;
      customerName: string;
      customerPhone: string;
      services: Array<{ service: { name: string } }>;
      notes?: string;
    }>,
    professionalName: string,
  ): string {
    const events: EventAttributes[] = appointments.map((appt) => {
      const serviceNames = appt.services.map((s) => s.service.name).join(', ');
      
      return {
        start: this.dateToArray(appt.startsAt),
        end: this.dateToArray(appt.endsAt),
        title: `${serviceNames} - ${appt.customerName}`,
        description: `Customer: ${appt.customerName}\nPhone: ${appt.customerPhone}\nServices: ${serviceNames}${appt.notes ? `\nNotes: ${appt.notes}` : ''}`,
        location: '',
        uid: `appointment-${appt.id}@proagenda`,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
      };
    });

    const { error, value } = createEvents(events);

    if (error) {
      throw new Error(`Failed to generate ICS: ${error.message}`);
    }

    return value || '';
  }

  /**
   * Generate ICS for a single appointment
   */
  generateAppointmentEvent(
    appointment: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      customerName: string;
      customerPhone: string;
      services: Array<{ service: { name: string } }>;
      notes?: string;
      filial: { name: string; address?: string };
    },
  ): string {
    const serviceNames = appointment.services.map((s) => s.service.name).join(', ');

    const event: EventAttributes = {
      start: this.dateToArray(appointment.startsAt),
      end: this.dateToArray(appointment.endsAt),
      title: `${serviceNames} - ${appointment.customerName}`,
      description: `Customer: ${appointment.customerName}\nPhone: ${appointment.customerPhone}\nServices: ${serviceNames}${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}`,
      location: appointment.filial.address || appointment.filial.name,
      uid: `appointment-${appointment.id}@proagenda`,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      productId: 'ProAgenda',
    };

    const { error, value } = createEvents([event]);

    if (error) {
      throw new Error(`Failed to generate ICS: ${error.message}`);
    }

    return value || '';
  }

  private dateToArray(date: Date): [number, number, number, number, number] {
    return [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
    ];
  }
}

