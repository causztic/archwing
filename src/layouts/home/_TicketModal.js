// Deprecated
import React from 'react';
import Modal from 'react-modal';

import { parseTicket } from '../../util/ticket'
import './_TicketModal.sass';
const Tesseract = window.Tesseract;

class TicketModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ticket1: null,
      ticket2: null
    }
  }

  componentWillMount() {
    Modal.setAppElement('main');
  }

  handleFileChosen(event) {
    const file = event.target.files[0]
    console.log(file.type)
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      throw "Invalid file type"
    }
    Tesseract.recognize(file).progress((status) => {
      console.log(status);
    }).then((data) => {
      this.setState({ ticket1: parseTicket(data.text) });
      console.log(this.state.ticket1);
    });
  }

  render() {
    return (
      <Modal
        isOpen={this.props.show}
        contentLabel={'TicketModal'}
        className='modal'
        overlayClassName='modal-overlay'
        onRequestClose={this.props.handleClose}
        shouldFocusAfterRender={false}
        shouldReturnFocusAfterClose={false}
      >
        <div className='modal-content'>
          <div className='modal-header'>
            <h2>Upload ticket PDF(s)</h2>
          </div>
          <div className='modal-body'>
            <div className='upload-box'>
              <div className='json'>
                {!this.state.ticket1 ? 'ticket1' : JSON.stringify(this.state.ticket1)}
              </div>
            </div>
            <div className='upload-box'>test</div>
          </div>
          <div className='modal-footer'>
            <input
              type='file'
              onChange={this.handleFileChosen.bind(this)}
            />
          </div>
        </div>
      </Modal>
    )
  }
}

export default TicketModal