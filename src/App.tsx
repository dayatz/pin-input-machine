import './App.css'
import { usePinInput } from './use-pin-input'

function App() {
  const {value, getInputProps, getHiddenInputProps, getLabelProps} = usePinInput({
    numOfFields: 4,
    name: "pincode",
    onComplete(value) {
      console.log({value})
    }
  })
  return (
    <div className="App">
      <form action="" onSubmit={e => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        console.log(formData.get('pincode'))
      }}>
      <div data-part="container">
        <label {...getLabelProps()}>Enter verification</label>
        <input {...getHiddenInputProps()} />
        <div data-part="input-group">
          {value.map((_, index) => (
            <input key={index} {...getInputProps(index)} />
          ))}
        </div>
      </div>
      <button type="submit" style={{ marginTop: 16}}>Submit</button>
      </form>
    </div>
  )
}

export default App
