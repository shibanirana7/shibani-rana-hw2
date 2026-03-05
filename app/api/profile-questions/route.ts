import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    questions: [
      {
        field: 'name',
        question: 'What is your full name?',
        type: 'text',
        required: true,
      },
      {
        field: 'email',
        question: 'What is your email address?',
        type: 'email',
        required: true,
      },
      {
        field: 'city',
        question: 'What city are you in? (e.g. San Francisco, New York, Chicago)',
        type: 'text',
        required: true,
        note: 'Only people in the same city will be matched together.',
      },
      {
        field: 'availability',
        question:
          'Which days and times are you typically free for happy hour? List as many windows as you like.',
        type: 'schedule',
        required: true,
        format: '[{ "day": "friday", "startTime": "17:00", "endTime": "20:00" }, ...]',
        options: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        example: [
          { day: 'friday', startTime: '17:00', endTime: '20:00' },
          { day: 'thursday', startTime: '16:30', endTime: '19:30' },
        ],
      },
      {
        field: 'venueTypes',
        question: 'What kind of venue vibe do you prefer? Pick all that apply.',
        type: 'multiselect',
        required: true,
        options: ['dive_bar', 'rooftop', 'sports_bar', 'wine_bar', 'craft_beer', 'cocktail_bar', 'karaoke'],
      },
      {
        field: 'drinkTypes',
        question: 'What do you like to drink? Pick all that apply.',
        type: 'multiselect',
        required: true,
        options: ['beer', 'cocktails', 'wine', 'spirits', 'non_alcoholic'],
      },
      {
        field: 'budgetRange',
        question: 'What is your typical per-person budget for a happy hour outing?',
        type: 'select',
        required: true,
        options: ['$', '$$', '$$$', '$$$$'],
        note: '$ = under $15, $$ = $15–30, $$$ = $30–50, $$$$ = $50+',
      },
      {
        field: 'groupSizePreference',
        question: 'Do you prefer a small intimate group, a medium group, or a large group?',
        type: 'select',
        required: true,
        options: ['intimate', 'medium', 'large'],
        note: 'intimate = 2–4 people, medium = 5–8 people, large = 9+ people',
      },
      {
        field: 'preferredContact',
        question: 'What is the best way to reach you once a group is formed?',
        type: 'select',
        required: false,
        options: ['email', 'discord', 'slack', 'sms'],
      },
      {
        field: 'contactHandle',
        question: 'What is your handle or username for the contact method above?',
        type: 'text',
        required: false,
      },
    ],
  })
}
