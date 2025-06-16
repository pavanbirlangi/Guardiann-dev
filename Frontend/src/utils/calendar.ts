import { format } from 'date-fns';

interface CalendarEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const start = new Date(`${event.startTime}`);
  const end = new Date(`${event.endTime}`);
  
  // Format dates for Google Calendar URL
  const startStr = format(start, "yyyyMMdd'T'HHmmss");
  const endStr = format(end, "yyyyMMdd'T'HHmmss");
  
  // Create the Google Calendar URL
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.title);
  url.searchParams.append('details', event.description);
  url.searchParams.append('location', event.location);
  url.searchParams.append('dates', `${startStr}/${endStr}`);
  
  return url.toString();
};

export const generateOutlookCalendarUrl = (event: CalendarEvent): string => {
  const start = new Date(`${event.startTime}`);
  const end = new Date(`${event.endTime}`);
  
  // Format dates for Outlook Calendar URL
  const startStr = format(start, "yyyy-MM-dd'T'HH:mm:ss");
  const endStr = format(end, "yyyy-MM-dd'T'HH:mm:ss");
  
  // Create the Outlook Calendar URL
  const url = new URL('https://outlook.live.com/calendar/0/deeplink');
  url.searchParams.append('path', '/calendar/action/compose');
  url.searchParams.append('rru', 'addevent');
  url.searchParams.append('subject', event.title);
  url.searchParams.append('body', event.description);
  url.searchParams.append('location', event.location);
  url.searchParams.append('startdt', startStr);
  url.searchParams.append('enddt', endStr);
  
  return url.toString();
}; 