'use client'
import { useForm } from 'react-hook-form'

const QuestionnaireForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = (data: any) => {
    console.log(data)
  }

  return (
    <div>
      <h1>QuestionnaireForm</h1>
      <form onSubmit={handleSubmit(onSubmit)}></form>
    </div>
  )
}

export default QuestionnaireForm
