// 课程模块路由：覆盖讲师、课程列表、学习进度三类后台管理页。
const courseRoutes = [
  {
    path: 'course/teacher',
    name: 'CourseTeacher',
    component: () => import('@/views/course/teacher/index.vue'),
    meta: { title: '讲师', icon: 'Avatar', permission: 'CourseTeacher' },
  },
  {
    path: 'course/list',
    name: 'CourseList',
    component: () => import('@/views/course/list/index.vue'),
    meta: { title: '课程列表', icon: 'Tickets', permission: 'CourseList' },
  },
  {
    path: 'course/progress',
    name: 'CourseProgress',
    component: () => import('@/views/course/progress/index.vue'),
    meta: { title: '学习进度', icon: 'DataLine', permission: 'CourseProgress' },
  },
]

export default courseRoutes
