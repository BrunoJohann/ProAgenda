() Add cache into tenant findBySlug
() Change the words filial and filiais to branch or branches, to ensure all the code is in English
() Some endpoint has a lot of database queries, maybe we could simplifier that ou add a cache for common queries
() appointment.service.ts the code is pretty good but can be better, so it needs to be refactor
() Table appointments has a column of status, we need to create an enum for that column even it is only in the code base and not in the database
() Turn customer phone in the table Appointments optional
() Endpoint to create an Appointment, check if it is necessary to have the field date and start in the contract of this endpoint
() Add email service, to send invites, reset password
() Future, add some whatsapp notification