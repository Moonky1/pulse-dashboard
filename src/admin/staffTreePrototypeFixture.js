export const STAFF_TREE_PROTOTYPE = Object.freeze({
  directory: {
    departments: [
      { id: 'department-operations', name: 'Operations' },
      { id: 'department-quality', name: 'Quality' },
    ],
    teams: [
      { id: 'team-philippines', name: 'Philippines', departmentId: 'department-operations', campaignId: 'campaign-garrett', campaignName: 'Auto Warranty Garrett' },
      { id: 'team-nicaragua', name: 'Nicaragua', departmentId: 'department-operations', campaignId: 'campaign-garrett', campaignName: 'Auto Warranty Garrett' },
      { id: 'team-quality', name: 'Quality Assurance', departmentId: 'department-quality' },
    ],
  },
  users: [
    { id: 'person-alex', fullName: 'Alex Rivera', employeeId: 'SYN-001', positionName: 'Supervisor', departmentId: 'department-operations', teamId: 'team-philippines', status: 'active' },
    { id: 'person-jordan', fullName: 'Jordan Lee', employeeId: 'SYN-002', positionName: 'Team Lead', departmentId: 'department-operations', teamId: 'team-philippines', status: 'active' },
    { id: 'person-taylor', fullName: 'Taylor Morgan', employeeId: 'SYN-003', positionName: 'Specialist', departmentId: 'department-operations', teamId: 'team-philippines', status: 'active' },
    { id: 'person-casey', fullName: 'Casey Brooks', employeeId: 'SYN-004', positionName: 'Supervisor', departmentId: 'department-operations', teamId: 'team-nicaragua', status: 'active' },
    { id: 'person-riley', fullName: 'Riley Chen', employeeId: 'SYN-005', positionName: 'Quality Lead', departmentId: 'department-quality', teamId: 'team-quality', status: 'active' },
    { id: 'person-sam', fullName: 'Sam Patel', employeeId: 'SYN-006', positionName: 'Quality Analyst', departmentId: 'department-quality', teamId: 'team-quality', status: 'active' },
  ],
  relationships: {
    companyName: 'Kampaign Kings',
    reporting: [
      { kind: 'primary_manager', personId: 'person-jordan', managerId: 'person-alex' },
      { kind: 'primary_manager', personId: 'person-taylor', managerId: 'person-jordan' },
      { kind: 'primary_manager', personId: 'person-sam', managerId: 'person-riley' },
    ],
    qaCoverage: [
      { personId: 'person-riley', teamId: 'team-philippines', teamName: 'Philippines' },
      { personId: 'person-sam', teamId: 'team-nicaragua', teamName: 'Nicaragua' },
    ],
  },
})
