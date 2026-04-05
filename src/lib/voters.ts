// Registered Voters Database

export interface Voter {
  id: string;
  name: string;
  department: string;
  year: number;
  isActive: boolean;
}
export const REGISTERED_VOTERS: Voter[] = [
  // Computer Science Department
  { id: 'PSCMR2025001', name: 'Aditya Kumar', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024002', name: 'Priya Sharma', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024003', name: 'Rahul Reddy', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024004', name: 'Sneha Patel', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024005', name: 'Vikram Singh', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024006', name: 'Anjali Gupta', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024007', name: 'Karthik Nair', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024008', name: 'Divya Krishnan', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024009', name: 'Arjun Menon', department: 'CSE', year: 2024, isActive: true },
  { id: 'PSCMR2024010', name: 'Neha Verma', department: 'CSE', year: 2024, isActive: true },
  
  // Electronics Department
  { id: 'PSCMR2024011', name: 'Sanjay Rao', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024012', name: 'Pooja Iyer', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024013', name: 'Manoj Kumar', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024014', name: 'Lakshmi Devi', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024015', name: 'Suresh Babu', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024016', name: 'Kavitha Reddy', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024017', name: 'Rajesh Kumar', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024018', name: 'Meena Kumari', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024019', name: 'Ganesh Prasad', department: 'ECE', year: 2024, isActive: true },
  { id: 'PSCMR2024020', name: 'Sunitha Rao', department: 'ECE', year: 2024, isActive: true },
  
  // Mechanical Department
  { id: 'PSCMR2024021', name: 'Venkat Reddy', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024022', name: 'Ravi Shankar', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024023', name: 'Deepak Sharma', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024024', name: 'Arun Kumar', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024025', name: 'Prashanth Gowda', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024026', name: 'Srinivas Murthy', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024027', name: 'Ramesh Babu', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024028', name: 'Naveen Kumar', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024029', name: 'Santosh Reddy', department: 'MECH', year: 2024, isActive: true },
  { id: 'PSCMR2024030', name: 'Prakash Rao', department: 'MECH', year: 2024, isActive: true },
  
  // Civil Department
  { id: 'PSCMR2024031', name: 'Harish Kumar', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024032', name: 'Swathi Naidu', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024033', name: 'Mohan Reddy', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024034', name: 'Bhavani Devi', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024035', name: 'Kishore Kumar', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024036', name: 'Padma Priya', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024037', name: 'Satish Babu', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024038', name: 'Uma Maheswari', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024039', name: 'Jagadish Reddy', department: 'CIVIL', year: 2024, isActive: true },
  { id: 'PSCMR2024040', name: 'Radha Krishna', department: 'CIVIL', year: 2024, isActive: true },
  
  // IT Department
  { id: 'PSCMR2024041', name: 'Tejas Patel', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024042', name: 'Shreya Sharma', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024043', name: 'Akash Reddy', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024044', name: 'Nithya Sri', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024045', name: 'Varun Kumar', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024046', name: 'Ananya Rao', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024047', name: 'Rohit Sharma', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024048', name: 'Keerthi Reddy', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024049', name: 'Ashwin Kumar', department: 'IT', year: 2024, isActive: true },
  { id: 'PSCMR2024050', name: 'Lavanya Devi', department: 'IT', year: 2024, isActive: true },
];


// Verify if voter ID is registered
export function isVoterRegistered(voterId: string): boolean {
  return REGISTERED_VOTERS.some(v => v.id === voterId && v.isActive);
}

// Get voter by ID
export function getVoterById(voterId: string): Voter | null {
  return REGISTERED_VOTERS.find(v => v.id === voterId) || null;
}

// Get voters by department
export function getVotersByDepartment(department: string): Voter[] {
  return REGISTERED_VOTERS.filter(v => v.department === department);
}

// Get department statistics
export function getDepartmentStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  REGISTERED_VOTERS.forEach(v => {
    stats[v.department] = (stats[v.department] || 0) + 1;
  });
  return stats;
}

// Total registered voters
export function getTotalRegisteredVoters(): number {
  return REGISTERED_VOTERS.filter(v => v.isActive).length;
}
