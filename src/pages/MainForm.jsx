import React from 'react'
import { useForm } from '../contexts/FormContext'
import ProgressSteps from '../components/ProgressSteps'
import Step1ClientType from '../components/Step1ClientType'
import Step2Consumption from '../components/Step2Consumption'
import Step3OfferCalculation from '../components/Step3OfferCalculation'
import Step4OfferDetails from '../components/Step4OfferDetails'
import Step5PersonalData from '../components/Step5PersonalData'
import Step6Confirmation from '../components/Step6Confirmation'

const MainForm = () => {
  const { currentStep } = useForm()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ClientType />
      case 2:
        return <Step2Consumption />
      case 3:
        return <Step3OfferCalculation />
      case 4:
        return <Step4OfferDetails />
      case 5:
        return <Step5PersonalData />
      case 6:
        return <Step6Confirmation />
      default:
        return <Step1ClientType />
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      {currentStep < 6 && <ProgressSteps />}
      {renderStep()}
    </div>
  )
}

export default MainForm
