import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const files = (names) => Promise.all(names.map((name) => readFile(new URL(name, import.meta.url), 'utf8')))

test('People and Staff Tree are shared protected directory surfaces', async () => {
  const [area, shell, people, tree, hook] = await files([
    './AdminArea.jsx',
    './components/AdminShell.jsx',
    './pages/AdminUsersPage.jsx',
    './pages/AdminStaffTreePage.jsx',
    './hooks/useManagedUsers.js',
  ])
  assert.match(area, /lazy\(.*AdminStaffTreePage/)
  assert.match(area, /path="staff-tree".*UsersRoute/s)
  assert.match(shell, /to="\/admin\/staff-tree">Staff Tree/)
  assert.match(people, /StaffAvatar/)
  assert.match(people, /Position not assigned/)
  assert.match(people, /Open .*staff profile/)
  assert.match(tree, /Department/)
  assert.match(tree, /Team/)
  assert.match(tree, /No people assigned yet/)
  assert.match(hook, /listManagedUsersWithDetails/)
  assert.doesNotMatch(`${people}\n${tree}\n${hook}`, /\.from\(|managerId|supervisorId/)
})

test('staff profile keeps human sections and does not invent unavailable photo or joined fields', async () => {
  const [detail, avatar, assignments, workspace] = await files([
    './pages/AdminUserDetailPage.jsx',
    './components/StaffAvatar.jsx',
    './components/OperationalAssignments.jsx',
    '../auth/screens/WorkspacePage.jsx',
  ])
  for (const label of ['Profile', 'Work details', 'Position', 'Pulse access', 'Account status']) assert.match(detail, new RegExp(label))
  assert.match(detail, /StaffAvatar/)
  assert.match(assignments, /No campaigns assigned/)
  assert.match(workspace, /Browse the directory and Staff Tree/)
  assert.doesNotMatch(`${detail}\n${avatar}`, /avatarUrl|photoUrl|Joined Pulse|createdAt/)
})
