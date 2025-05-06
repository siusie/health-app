const mockData = {
  users: [
    {
      user_id: 1,
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      created_at: '2024-11-26T00:00:00Z',
    },
    {
      user_id: 2,
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      created_at: '2024-12-17T00:00:00Z',
    },
    {
      user_id: 3,
      email: 'alice.johnson@example.com',
      first_name: 'Alice',
      last_name: 'Johnson',
      created_at: '2025-01-13T00:00:00Z',
    },
    {
      user_id: 4,
      email: 'bob.brown@example.com',
      first_name: 'Bob',
      last_name: 'Brown',
      created_at: '2026-07-09T00:00:00Z',
    },
  ],

  parent: [
    {
      user_id: 1,
      relationship_type: 'Father',
      created_at: '2024-11-26T00:00:00Z',
    },
    {
      user_id: 2,
      relationship_type: 'Mother',
      created_at: '2024-12-17T00:00:00Z',
    },
  ],

  medical_professional: [
    {
      user_id: 3,
      location: '123 Medical Plaza, Springfield',
      phone_number: '555-123-4567',
      specialty: 'Pediatrician',
    },
    {
      user_id: 4,
      location: '456 Health Blvd, Metropolis',
      phone_number: '555-987-6543',
      specialty: 'Nutritionist',
    },
  ],

  baby: [
    {
      baby_id: 1,
      full_name: 'Baby Doe',
      date_of_birth: '2023-01-01',
      weight: 3.5,
      height: 50.0,
      sex: 'M',
      created_at: '2024-11-17T00:00:00Z',
    },
    {
      baby_id: 2,
      full_name: 'Baby Smith',
      date_of_birth: '2023-05-15',
      weight: 3.2,
      height: 48.0,
      sex: 'F',
      created_at: '2024-11-17T00:00:00Z',
    },
  ],

  baby_parent: [
    { baby_id: 1, parent_id: 1, parent_role: 'Father' },
    { baby_id: 1, parent_id: 2, parent_role: 'Mother' },
    { baby_id: 2, parent_id: 1, parent_role: 'Father' },
    { baby_id: 2, parent_id: 2, parent_role: 'Mother' },
  ],

  feeding_schedule: [
    { feeding_schedule_id: 1, schedule_date: '2024-11-17', baby_id: 1 },
    { feeding_schedule_id: 2, schedule_date: '2024-11-17', baby_id: 2 },
  ],

  meal: [
    {
      meal_id: 1,
      meal_name: 'Milk Feed',
      meal_type: 'Breast Milk',
      amount: 200.0,
      note: 'Morning feeding',
      date: '2024-11-17',
      feeding_schedule_id: 1,
    },
    {
      meal_id: 2,
      meal_name: 'Solid Food',
      meal_type: 'Puree',
      amount: 150.0,
      note: 'First solid food',
      date: '2024-11-17',
      feeding_schedule_id: 1,
    },
    {
      meal_id: 3,
      meal_name: 'Milk Feed',
      meal_type: 'Formula',
      amount: 180.0,
      note: 'Evening feeding',
      date: '2024-11-17',
      feeding_schedule_id: 2,
    },
  ],

  journal_entries: [
    {
      entry_id: 1,
      user_id: 1,
      title: 'Entry No. 1',
      content: 'Hello, World!',
      entry_date: '2024-11-15',
      created_at: '2024-11-15T00:00:00Z',
    },
    {
      entry_id: 2,
      user_id: 1,
      title: "Doctor's Appointment Update",
      content: 'Went smoothly. Baby is healthy and happy.',
      entry_date: '2024-11-17',
      created_at: '2024-11-17T00:00:00Z',
    },
    {
      entry_id: 3,
      user_id: 1,
      title: "Today's Thoughts",
      content: 'Tired but in-laws offered to help with looking after the baby!',
      entry_date: '2024-11-17',
      created_at: '2024-11-17T00:00:00Z',
    },
  ],

  tags: [
    { tag_id: 1, tag_name: 'Baby' },
    { tag_id: 2, tag_name: 'Parent' },
    { tag_id: 3, tag_name: 'Medical' },
    { tag_id: 4, tag_name: 'Mood' },
    { tag_id: 5, tag_name: 'Health' },
    { tag_id: 6, tag_name: 'Miscellaneous' },
  ],

  journal_entry_tags: [
    { entry_id: 1, tag_id: 6 },
    { entry_id: 2, tag_id: 1 },
    { entry_id: 2, tag_id: 3 },
    { entry_id: 3, tag_id: 4 },
  ],

  reminders: [
    {
      reminder_id: 1,
      parent_id: 1,
      baby_id: 1,
      reminder_type: 'Doctor Appointment',
      reminder_date: '2024-12-01T10:00:00Z',
      created_at: '2024-11-15T00:00:00Z',
    },
    {
      reminder_id: 2,
      parent_id: 2,
      baby_id: 2,
      reminder_type: 'Vaccination',
      reminder_date: '2024-12-05T09:00:00Z',
      created_at: '2024-11-15T00:00:00Z',
    },
  ],
};

module.exports = mockData;

